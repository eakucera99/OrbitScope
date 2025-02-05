from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Satellite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    category = db.Column(db.String, nullable=False)
    tle_line1 = db.Column(db.String, nullable=False)
    tle_line2 = db.Column(db.String, nullable=False)

    def __repr__(self):
        return f"<Satellite {self.name}>"