import http.server
import socketserver
import json
import sqlite3
import os
import re
import hashlib
import secrets
from datetime import datetime

PORT = 5000
DB_FILE = os.path.join(os.path.dirname(__file__), 'backend', 'db', 'medistock.db')

def match_medicine_for_order_item(item_name, medicines, medicine_id=None):
    if medicine_id:
        by_id = next((medicine for medicine in medicines if medicine[0] == medicine_id), None)
        if by_id:
            return by_id
    normalized_item_name = str(item_name or '').strip().casefold()
    exact = [medicine for medicine in medicines if medicine[1].strip().casefold() == normalized_item_name]
    if len(exact) == 1:
        return exact[0]
    if len(exact) > 1:
        return None
    fallback = [medicine for medicine in medicines
                if normalized_item_name.startswith(medicine[1].strip().split()[0].casefold())]
    return fallback[0] if len(fallback) == 1 else None

def init_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pharmacy_info (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_open INTEGER NOT NULL DEFAULT 1,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            desc TEXT,
            price INTEGER NOT NULL,
            stock INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Tersedia',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT DEFAULT '-',
            delivery_type TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            service_fee INTEGER NOT NULL DEFAULT 3000,
            total_amount INTEGER NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'Lunas (QRIS)',
            order_status TEXT NOT NULL DEFAULT 'Menunggu Konfirmasi',
            timestamp TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            medicine_id TEXT,
            name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            price INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    ''')

    # Upgrade databases created before order items stored a stable medicine ID.
    item_columns = {row[1] for row in cursor.execute("PRAGMA table_info(order_items)").fetchall()}
    if 'medicine_id' not in item_columns:
        cursor.execute("ALTER TABLE order_items ADD COLUMN medicine_id TEXT")
    # Seed default data if empty
    cursor.execute("SELECT COUNT(*) FROM pharmacy_info")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO pharmacy_info (id, name, is_open) VALUES ('APOTEK-1', 'Apotek Sehat', 1)")
        
    cursor.execute("SELECT COUNT(*) FROM medicines")
    if cursor.fetchone()[0] == 0:
        meds = [
            ('MED-1', 'Paracetamol 500mg', 'Pereda demam & nyeri ringan hingga sedang', 12500, 45, 'Tersedia'),
            ('MED-2', 'Amoxicillin 500mg', 'Antibiotik penanganan infeksi bakteri', 28000, 20, 'Tersedia'),
            ('MED-3', 'Vitamin C 1000mg', 'Suplemen daya tahan tubuh tablet kunyah', 35000, 15, 'Tersedia'),
            ('MED-4', 'Antasida Doen Tablet', 'Obat maag & asam lambung berlebih', 8500, 30, 'Tersedia'),
            ('MED-5', 'Mefenamic Acid 500mg', 'Pereda nyeri sakit gigi & nyeri haid', 18000, 0, 'Habis')
        ]
        cursor.executemany("INSERT INTO medicines (id, name, desc, price, stock, status) VALUES (?, ?, ?, ?, ?, ?)", meds)
        
    cursor.execute("SELECT COUNT(*) FROM orders")
    if cursor.fetchone()[0] == 0:
        orders = [
            ('MDS-9824', 'Budi Santoso', '081234567890', 'Jl. Merdeka No. 12, Kel. Menteng', 'Pengantaran', 60000, 3000, 63000, 'Lunas (QRIS)', 'Menunggu Konfirmasi', '2026-09-20 20:45'),
            ('MDS-9823', 'Siti Rahma', '085711223344', '-', 'Ambil Sendiri', 28000, 3000, 31000, 'Lunas (QRIS)', 'Selesai', '2026-09-20 19:15'),
            ('MDS-9822', 'Deni Kurniawan', '081988776655', 'Jl. Sudirman No. 45', 'Pengantaran', 29500, 3000, 32500, 'Lunas (QRIS)', 'Selesai', '2026-09-20 18:30')
        ]
        cursor.executemany("INSERT INTO orders (id, customer_name, phone, address, delivery_type, subtotal, service_fee, total_amount, payment_status, order_status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", orders)
        
        items = [
            ('MDS-9824', 'Paracetamol 500mg', 2, 12500),
            ('MDS-9824', 'Vitamin C 1000mg', 1, 35000),
            ('MDS-9823', 'Amoxicillin 500mg', 1, 28000),
            ('MDS-9822', 'Paracetamol 500mg', 1, 12500),
            ('MDS-9822', 'Antasida Doen Tablet', 2, 8500)
        ]
        cursor.executemany("INSERT INTO order_items (order_id, name, qty, price) VALUES (?, ?, ?, ?)", items)

    # Backfill legacy and seeded items only when the catalog name is unique.
    cursor.execute('''
        UPDATE order_items
        SET medicine_id = (
            SELECT medicines.id FROM medicines
            WHERE lower(trim(medicines.name)) = lower(trim(order_items.name))
            LIMIT 1
        )
        WHERE medicine_id IS NULL
          AND (
            SELECT COUNT(*) FROM medicines AS exact_medicine
            WHERE lower(trim(exact_medicine.name)) = lower(trim(order_items.name))
          ) = 1
    ''')

    conn.commit()
    conn.close()

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _json_response(self, data, status=200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        path = self.path.split('?')[0]
        
        if path == '/api/health':
            self._json_response({'status': 'ok', 'service': 'MEDISTOCK API (Python)', 'timestamp': str(datetime.now())})
            
        elif path == '/api/pharmacy/info':
            cursor.execute("SELECT id, name, is_open FROM pharmacy_info WHERE id = 'APOTEK-1'")
            row = cursor.fetchone()
            self._json_response({'success': True, 'data': {'id': row[0], 'name': row[1], 'isOpen': bool(row[2])}})
            
        elif path == '/api/medicines':
            search = ''
            if '?' in self.path:
                from urllib.parse import parse_qs
                query_components = parse_qs(self.path.split('?')[1])
                search = query_components.get('search', [''])[0]

            if search:
                cursor.execute("SELECT id, name, desc, price, stock, status FROM medicines WHERE LOWER(name) LIKE ? OR LOWER(desc) LIKE ? ORDER BY created_at ASC", (f"%{search.lower()}%", f"%{search.lower()}%"))
            else:
                cursor.execute("SELECT id, name, desc, price, stock, status FROM medicines ORDER BY created_at ASC")
                
            rows = cursor.fetchall()
            meds = [{'id': r[0], 'name': r[1], 'desc': r[2], 'price': r[3], 'stock': r[4], 'status': r[5]} for r in rows]
            self._json_response({'success': True, 'data': meds})
            
        elif path == '/api/orders':
            cursor.execute("SELECT id, customer_name, phone, address, delivery_type, subtotal, service_fee, total_amount, payment_status, order_status, timestamp FROM orders ORDER BY rowid DESC")
            rows = cursor.fetchall()
            orders = []
            for r in rows:
                cursor.execute("SELECT medicine_id, name, qty, price FROM order_items WHERE order_id = ?", (r[0],))
                item_rows = cursor.fetchall()
                items = [{'medicineId': ir[0], 'name': ir[1], 'qty': ir[2], 'price': ir[3]} for ir in item_rows]
                orders.append({
                    'id': r[0],
                    'customerName': r[1],
                    'phone': r[2],
                    'address': r[3],
                    'deliveryType': r[4],
                    'subtotal': r[5],
                    'serviceFee': r[6],
                    'totalAmount': r[7],
                    'paymentStatus': r[8],
                    'orderStatus': r[9],
                    'timestamp': r[10],
                    'items': items
                })
            self._json_response({'success': True, 'data': orders})
        else:
            self._json_response({'error': 'Not found'}, 404)

        conn.close()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length > 0 else {}
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        if self.path == '/api/auth/login':
            username = body.get('username') or body.get('email')
            password = body.get('password')
            if username == 'apotek@medistock.com' and password == 'password123':
                self._json_response({
                    'success': True,
                    'message': 'Login berhasil',
                    'token': 'demo_jwt_token_medistock_2026',
                    'user': {'id': 'APOTEK-1', 'name': 'Apotek Sehat', 'email': 'apotek@medistock.com', 'role': 'pharmacy_staff'}
                })
            else:
                self._json_response({'success': False, 'message': 'Email atau password tidak valid.'}, 401)

        elif self.path == '/api/auth/customer/register':
            email = str(body.get('email') or '').strip().lower()
            password = body.get('password')
            if not email or not password:
                self._json_response({'success': False, 'message': 'Email dan password wajib diisi.'}, 400)
            elif not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
                self._json_response({'success': False, 'message': 'Format email tidak valid.'}, 400)
            elif not isinstance(password, str) or len(password) < 8:
                self._json_response({'success': False, 'message': 'Password minimal 8 karakter.'}, 400)
            else:
                salt = secrets.token_hex(16)
                password_hash = salt + '$' + hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 120000).hex()
                try:
                    user_id = secrets.token_hex(16)
                    cursor.execute(
                        'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
                        (user_id, email, password_hash, 'customer')
                    )
                    conn.commit()
                    self._json_response({
                        'success': True,
                        'message': 'Pendaftaran berhasil.',
                        'token': secrets.token_urlsafe(32),
                        'user': {'id': user_id, 'email': email, 'role': 'customer'}
                    }, 201)
                except sqlite3.IntegrityError:
                    self._json_response({'success': False, 'message': 'Email sudah terdaftar. Silakan masuk.'}, 409)

        elif self.path == '/api/auth/customer/login':
            email = str(body.get('email') or '').strip().lower()
            password = body.get('password')
            cursor.execute('SELECT id, password_hash, role FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            valid_password = False
            if user and user[2] == 'customer' and isinstance(password, str):
                salt, stored_hash = user[1].split('$', 1)
                candidate_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 120000).hex()
                valid_password = secrets.compare_digest(candidate_hash, stored_hash)
            if valid_password:
                self._json_response({
                    'success': True,
                    'message': 'Login berhasil.',
                    'token': secrets.token_urlsafe(32),
                    'user': {'id': user[0], 'email': email, 'role': 'customer'}
                })
            else:
                self._json_response({'success': False, 'message': 'Email atau password tidak valid.'}, 401)
                
        elif self.path == '/api/orders':
            order_id = f"MDS-{import_random_id()}"
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            cursor.execute(
                "INSERT INTO orders (id, customer_name, phone, address, delivery_type, subtotal, service_fee, total_amount, payment_status, order_status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (order_id, body['customerName'], body['phone'], body.get('address', '-'), body['deliveryType'], body['subtotal'], body.get('serviceFee', 3000), body['totalAmount'], 'Lunas (QRIS)', 'Menunggu Konfirmasi', timestamp)
            )
            for item in body.get('items', []):
                cursor.execute("INSERT INTO order_items (order_id, medicine_id, name, qty, price) VALUES (?, ?, ?, ?, ?)", (order_id, item.get('medicineId', item.get('id')), item['name'], item['qty'], item['price']))
            conn.commit()
            new_order = {**body, 'id': order_id, 'timestamp': timestamp, 'paymentStatus': 'Lunas (QRIS)', 'orderStatus': 'Menunggu Konfirmasi'}
            self._json_response({'success': True, 'data': new_order}, 201)
            
        elif re.match(r'^/api/orders/[^/]+/confirm-payment$', self.path):
            order_id = self.path.split('/')[3]
            conn.execute('BEGIN IMMEDIATE')
            cursor.execute("SELECT medicine_id, name, qty FROM order_items WHERE order_id = ?", (order_id,))
            items = cursor.fetchall()
            cursor.execute("SELECT id, name, stock, status FROM medicines")
            medicines = cursor.fetchall()
            deductions = {}
            for medicine_id, item_name, qty in items:
                matched = match_medicine_for_order_item(item_name, medicines, medicine_id)
                if not matched or not isinstance(qty, int) or qty <= 0:
                    conn.rollback()
                    self._json_response({'success': False, 'message': f'Obat {item_name} tidak dapat dicocokkan ke katalog; stok tidak diubah.'}, 409)
                    conn.close()
                    return
                deductions[matched[0]] = deductions.get(matched[0], 0) + qty

            for medicine_id, quantity in deductions.items():
                medicine = next(med for med in medicines if med[0] == medicine_id)
                if medicine[2] < quantity:
                    conn.rollback()
                    self._json_response({'success': False, 'message': f'Stok {medicine[1]} tidak mencukupi. Stok tersedia hanya {medicine[2]}.'}, 409)
                    conn.close()
                    return

            for medicine_id, quantity in deductions.items():
                medicine = next(med for med in medicines if med[0] == medicine_id)
                new_stock = medicine[2] - quantity
                new_status = 'Habis' if new_stock == 0 else medicine[3]
                cursor.execute("UPDATE medicines SET stock = ?, status = ? WHERE id = ?", (new_stock, new_status, medicine_id))
            conn.commit()
            self._json_response({'success': True, 'message': 'Pembayaran berhasil dikonfirmasi.'})
        else:
            self._json_response({'error': 'Not found'}, 404)

        conn.close()

    def do_PUT(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length > 0 else {}
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        if self.path == '/api/pharmacy/status':
            is_open = 1 if body.get('isOpen') else 0
            cursor.execute("UPDATE pharmacy_info SET is_open = ? WHERE id = 'APOTEK-1'", (is_open,))
            conn.commit()
            self._json_response({'success': True, 'data': {'isOpen': bool(is_open)}})
            
        elif self.path == '/api/medicines/inventory':
            items = body.get('items', [])
            for item in items:
                stock_num = max(0, int(item.get('stock', 0)))
                status = 'Habis' if stock_num == 0 else item.get('status', 'Tersedia')
                cursor.execute("UPDATE medicines SET price = ?, stock = ?, status = ? WHERE id = ?", (int(item.get('price', 0)), stock_num, status, item['id']))
            conn.commit()
            cursor.execute("SELECT id, name, desc, price, stock, status FROM medicines ORDER BY created_at ASC")
            rows = cursor.fetchall()
            meds = [{'id': r[0], 'name': r[1], 'desc': r[2], 'price': r[3], 'stock': r[4], 'status': r[5]} for r in rows]
            self._json_response({'success': True, 'data': meds})
        else:
            self._json_response({'error': 'Not found'}, 404)

        conn.close()

    def do_PATCH(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(content_length).decode('utf-8')) if content_length > 0 else {}
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        if re.match(r'^/api/orders/[^/]+/status$', self.path):
            order_id = self.path.split('/')[3]
            new_status = body.get('orderStatus')
            cursor.execute("SELECT order_status FROM orders WHERE id = ?", (order_id,))
            order = cursor.fetchone()
            if not order:
                self._json_response({'success': False, 'message': 'Pesanan tidak ditemukan.'}, 404)
            elif order[0] in ('Selesai', 'Dibatalkan'):
                self._json_response({'success': False, 'message': 'Pesanan ini sudah berakhir.'}, 409)
            elif new_status != 'Dibatalkan':
                cursor.execute("UPDATE orders SET order_status = ? WHERE id = ?", (new_status, order_id))
                conn.commit()
                self._json_response({'success': True, 'message': 'Status berhasil diperbarui'})
            else:
                # The status change and stock restoration must commit together.
                # Checking the current status above also prevents duplicate restores.
                conn.execute('BEGIN IMMEDIATE')
                cursor.execute("SELECT order_status FROM orders WHERE id = ?", (order_id,))
                current_order = cursor.fetchone()
                if not current_order or current_order[0] in ('Selesai', 'Dibatalkan'):
                    conn.rollback()
                    self._json_response({'success': False, 'message': 'Pesanan ini sudah berakhir.'}, 409)
                else:
                    cursor.execute("SELECT medicine_id, name, qty FROM order_items WHERE order_id = ?", (order_id,))
                    items = cursor.fetchall()
                    cursor.execute("SELECT id, name, stock, status FROM medicines")
                    medicines = cursor.fetchall()
                    restored = {}
                    unmatched_items = []
                    for medicine_id, item_name, qty in items:
                        matched = match_medicine_for_order_item(item_name, medicines, medicine_id)
                        if not matched or not isinstance(qty, int) or qty <= 0:
                            unmatched_items.append(item_name)
                        else:
                            restored[matched[0]] = restored.get(matched[0], 0) + qty

                    if unmatched_items:
                        conn.rollback()
                        self._json_response({
                            'success': False,
                            'message': f"Obat {', '.join(unmatched_items)} tidak dapat dicocokkan ke katalog; pembatalan belum dilakukan."
                        }, 409)
                    else:
                        for medicine_id, quantity in restored.items():
                            medicine = next(med for med in medicines if med[0] == medicine_id)
                            new_stock = medicine[2] + quantity
                            new_status = 'Tersedia' if new_stock > 0 else medicine[3]
                            cursor.execute("UPDATE medicines SET stock = ?, status = ? WHERE id = ?",
                                           (new_stock, new_status, medicine_id))

                        cursor.execute("UPDATE orders SET order_status = 'Dibatalkan' WHERE id = ?", (order_id,))
                        conn.commit()
                        self._json_response({'success': True, 'message': 'Pesanan dibatalkan dan stok obat dikembalikan.'})
        else:
            self._json_response({'error': 'Not found'}, 404)

        conn.close()

def import_random_id():
    import random
    return random.randint(1000, 9999)

if __name__ == '__main__':
    init_db()
    print(f"MEDISTOCK API Server running on http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        httpd.serve_forever()
