from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import os
app = Flask(__name__)



app.config['SECRET_KEY'] = os.getenv(
    'SECRET_KEY',
    'dev-secret-key'
)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=7)

db = SQLAlchemy(app)


# -------------------------
# DATABASE MODEL
# -------------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(db.String(50), unique=True, nullable=False)

    password = db.Column(db.String(255), nullable=False)

    score = db.Column(db.Integer, default=0)

    coins = db.Column(db.Integer, default=0)

    level = db.Column(db.Integer, default=1)

    bricks = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, server_default=db.func.now())


# -------------------------
# HOME
# -------------------------

@app.route('/')
def home():

    if 'user_id' in session:
        return redirect('/dashboard')

    return redirect('/login')


# -------------------------
# REGISTER
# -------------------------

@app.route('/register', methods=['GET', 'POST'])
def register():

    if request.method == 'POST':

        username = request.form['username'].strip()

        password = request.form['password']

        if len(username) < 3:
            flash('Username too short')
            return redirect('/register')

        if len(password) < 4:
            flash('Password too short')
            return redirect('/register')

        user = User.query.filter_by(username=username).first()

        if user:
            flash('Username already exists')
            return redirect('/register')

        hashed_password = generate_password_hash(password)

        new_user = User(
            username=username,
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful')

        return redirect('/login')

    return render_template('register.html')


# -------------------------
# LOGIN
# -------------------------

@app.route('/login', methods=['GET', 'POST'])
def login():

    if request.method == 'POST':

        username = request.form['username']

        password = request.form['password']

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password, password):

            session.permanent = True

            session['user_id'] = user.id

            session['username'] = user.username

            return redirect('/dashboard')

        flash('Invalid username or password')

    return render_template('login.html')


# -------------------------
# LOGOUT
# -------------------------

@app.route('/logout')
def logout():

    session.clear()

    return redirect('/login')


# -------------------------
# DASHBOARD
# -------------------------

@app.route('/dashboard')
def dashboard():

    if 'user_id' not in session:
        return redirect('/login')

    user = User.query.get(session['user_id'])

    return render_template(
        'dashboard.html',
        user=user
    )


# -------------------------
# GAME PAGE
# -------------------------

@app.route('/game')
def game():

    if 'user_id' not in session:
        return redirect('/login')

    return render_template('game.html')


# -------------------------
# SAVE SCORE API
# -------------------------

@app.route('/api/save_score', methods=['POST'])
def save_score():

    if 'user_id' not in session:
        return {"success": False}

    user = User.query.get(session['user_id'])

    data = request.get_json()

    score = int(data.get('score', 0))

    coins = int(data.get('coins', 0))

    level = int(data.get('level', 1))

    bricks = int(data.get('bricks', 0))

    user.score = score
    user.coins = coins
    user.level = level
    user.bricks = bricks

    db.session.commit()

    return {
        "success": True
    }


# -------------------------
# LEADERBOARD
# -------------------------

@app.route('/leaderboard')
def leaderboard():

    users = User.query.order_by(User.score.desc()).limit(100).all()

    return render_template(
        'leaderboard.html',
        users=users
    )


# -------------------------
# CREATE DATABASE
# -------------------------

with app.app_context():
    db.create_all()


# -------------------------
# RUN
# -------------------------

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
