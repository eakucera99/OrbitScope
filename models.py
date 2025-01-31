from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Association table for many-to-many relationship
user_favorites = db.Table('user_favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('satellite_id', db.Integer, db.ForeignKey('satellite.id'), primary_key=True)
)

class Satellite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    category = db.Column(db.String, nullable=False)
    tle_line1 = db.Column(db.String, nullable=False)
    tle_line2 = db.Column(db.String, nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    favorites = db.relationship('Satellite', secondary=user_favorites, lazy='dynamic', backref='favorited_by')
