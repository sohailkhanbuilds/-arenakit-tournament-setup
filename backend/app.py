import os
import re
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import jwt
from sqlalchemy import UniqueConstraint, Index

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})
database_url = os.getenv("DATABASE_URL", "").strip()
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url or "sqlite:///arenakit-dev.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET"] = os.getenv("JWT_SECRET", "")
app.config["TOKEN_HOURS"] = int(os.getenv("TOKEN_HOURS", "72"))
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

def now_utc():
    return datetime.now(timezone.utc)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="organizer")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now_utc)
    tournaments = db.relationship("Tournament", backref="organizer", lazy=True, cascade="all, delete-orphan")

class Tournament(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    slug = db.Column(db.String(90), nullable=False)
    name = db.Column(db.String(140), nullable=False)
    game = db.Column(db.String(60), nullable=False)
    format = db.Column(db.String(60), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    rules = db.Column(db.Text, nullable=False, default="")
    event_date = db.Column(db.String(40), nullable=False, default="")
    location = db.Column(db.String(120), nullable=False, default="Online")
    slots = db.Column(db.Integer, nullable=False, default=25)
    prize = db.Column(db.String(160), nullable=False, default="Not announced")
    registration_open = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now_utc)
    registrations = db.relationship("Registration", backref="tournament", lazy=True, cascade="all, delete-orphan")
    matches = db.relationship("Match", backref="tournament", lazy=True, cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint("owner_id", "slug", name="uq_tournament_owner_slug"),)

class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournament.id", ondelete="CASCADE"), nullable=False, index=True)
    team_name = db.Column(db.String(100), nullable=False)
    captain_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(40), nullable=False, default="")
    player_ids = db.Column(db.Text, nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default="pending")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now_utc)
    __table_args__ = (UniqueConstraint("tournament_id", "email", name="uq_registration_tournament_email"),)

class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey("tournament.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    match_date = db.Column(db.String(40), nullable=False, default="")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now_utc)
    results = db.relationship("MatchResult", backref="match", lazy=True, cascade="all, delete-orphan")

class MatchResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey("match.id", ondelete="CASCADE"), nullable=False, index=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registration.id", ondelete="CASCADE"), nullable=False, index=True)
    placement_points = db.Column(db.Integer, nullable=False, default=0)
    kills = db.Column(db.Integer, nullable=False, default=0)
    registration = db.relationship("Registration")
    __table_args__ = (UniqueConstraint("match_id", "registration_id", name="uq_result_match_registration"),)

def json_error(message, status=400):
    return jsonify({"error": message}), status

def make_slug(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return (slug[:80] or "tournament") + "-" + datetime.now().strftime("%m%d%H%M%S")

def token_for(user):
    if not app.config["JWT_SECRET"]:
        raise RuntimeError("JWT_SECRET is not configured")
    return jwt.encode({"sub": str(user.id), "role": user.role, "exp": now_utc() + timedelta(hours=app.config["TOKEN_HOURS"])}, app.config["JWT_SECRET"], algorithm="HS256")

def auth_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return json_error("Bearer token required", 401)
        try:
            payload = jwt.decode(header[7:], app.config["JWT_SECRET"], algorithms=["HS256"])
            g.current_user = db.session.get(User, int(payload["sub"]))
            if not g.current_user:
                return json_error("Account not found", 401)
        except (jwt.PyJWTError, ValueError, TypeError):
            return json_error("Invalid or expired token", 401)
        return fn(*args, **kwargs)
    return wrapped

def owned_tournament(tournament_id):
    item = db.session.get(Tournament, tournament_id)
    if not item:
        return None, json_error("Tournament not found", 404)
    if item.owner_id != g.current_user.id:
        return None, json_error("You do not have access to this tournament", 403)
    return item, None

def tournament_json(item, include_private=False):
    result = {"id": item.id, "slug": item.slug, "name": item.name, "game": item.game, "format": item.format,
              "description": item.description, "rules": item.rules, "event_date": item.event_date,
              "location": item.location, "slots": item.slots, "prize": item.prize,
              "registration_open": item.registration_open, "registration_count": len(item.registrations),
              "created_at": item.created_at.isoformat() if item.created_at else None}
    if include_private:
        result["owner_id"] = item.owner_id
    return result

def leaderboard_data(tournament):
    totals = {}
    for registration in tournament.registrations:
        totals[registration.id] = {"registration_id": registration.id, "team": registration.team_name,
                                   "matches": 0, "placement_points": 0, "kills": 0, "total": 0}
    for match in tournament.matches:
        for score in match.results:
            if score.registration_id in totals:
                row = totals[score.registration_id]
                row["matches"] += 1
                row["placement_points"] += score.placement_points
                row["kills"] += score.kills
                row["total"] += score.placement_points + score.kills
    return sorted(totals.values(), key=lambda row: (-row["total"], -row["placement_points"], -row["kills"], row["team"].lower()))

@app.get("/")
def home():
    return jsonify({"name": "ArenaKit API", "status": "ok", "version": "1.0.0", "docs": "See backend/README.md"})

@app.get("/health")
def health():
    try:
        db.session.execute(db.text("SELECT 1"))
        return jsonify({"status": "ok", "database": "connected"})
    except Exception:
        db.session.rollback()
        return jsonify({"status": "degraded", "database": "unavailable"}), 503

@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name, email, password = (str(data.get(k, "")).strip() for k in ("name", "email", "password"))
    if not name or len(name) > 100:
        return json_error("Name is required (maximum 100 characters)")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 255:
        return json_error("A valid email is required")
    if len(password) < 10:
        return json_error("Password must be at least 10 characters")
    if not app.config["JWT_SECRET"]:
        return json_error("Server authentication is not configured", 503)
    if User.query.filter_by(email=email.lower()).first():
        return json_error("An account with this email already exists", 409)
    user = User(name=name, email=email.lower(), password_hash=bcrypt.generate_password_hash(password).decode(), role="organizer")
    db.session.add(user)
    db.session.commit()
    return jsonify({"token": token_for(user), "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}}), 201

@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return json_error("Email or password is incorrect", 401)
    return jsonify({"token": token_for(user), "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role}})

@app.get("/api/me")
@auth_required
def me():
    u = g.current_user
    return jsonify({"id": u.id, "name": u.name, "email": u.email, "role": u.role})

@app.get("/api/tournaments")
def public_tournaments():
    items = Tournament.query.filter_by(registration_open=True).order_by(Tournament.created_at.desc()).all()
    return jsonify([tournament_json(item) for item in items])

@app.post("/api/tournaments")
@auth_required
def create_tournament():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    game = str(data.get("game", "")).strip()
    fmt = str(data.get("format", "")).strip()
    if not name or len(name) > 140 or not game or not fmt:
        return json_error("Name, game and format are required")
    try:
        slots = int(data.get("slots", 25))
        if not 2 <= slots <= 10000:
            raise ValueError()
    except (TypeError, ValueError):
        return json_error("Slots must be between 2 and 10000")
    item = Tournament(owner_id=g.current_user.id, slug=make_slug(name), name=name, game=game[:60], format=fmt[:60],
        description=str(data.get("description", ""))[:3000], rules=str(data.get("rules", ""))[:6000],
        event_date=str(data.get("event_date", ""))[:40], location=str(data.get("location", "Online"))[:120],
        slots=slots, prize=str(data.get("prize", "Not announced"))[:160],
        registration_open=bool(data.get("registration_open", True)))
    db.session.add(item); db.session.commit()
    return jsonify(tournament_json(item, True)), 201

@app.get("/api/organizer/tournaments")
@auth_required
def my_tournaments():
    items = Tournament.query.filter_by(owner_id=g.current_user.id).order_by(Tournament.created_at.desc()).all()
    return jsonify([tournament_json(item, True) for item in items])

@app.get("/api/organizer/tournaments/<int:tournament_id>")
@auth_required
def get_my_tournament(tournament_id):
    item, error = owned_tournament(tournament_id)
    if error: return error
    return jsonify(tournament_json(item, True))

@app.patch("/api/organizer/tournaments/<int:tournament_id>")
@auth_required
def update_tournament(tournament_id):
    item, error = owned_tournament(tournament_id)
    if error: return error
    data = request.get_json(silent=True) or {}
    fields = {"name": (140, str), "game": (60, str), "format": (60, str), "description": (3000, str),
              "rules": (6000, str), "event_date": (40, str), "location": (120, str), "prize": (160, str)}
    for field, (limit, caster) in fields.items():
        if field in data: setattr(item, field, caster(data[field]).strip()[:limit])
    if "slots" in data:
        try:
            slots = int(data["slots"])
            if not 2 <= slots <= 10000: raise ValueError()
            item.slots = slots
        except (TypeError, ValueError): return json_error("Slots must be between 2 and 10000")
    if "registration_open" in data: item.registration_open = bool(data["registration_open"])
    db.session.commit()
    return jsonify(tournament_json(item, True))

@app.delete("/api/organizer/tournaments/<int:tournament_id>")
@auth_required
def delete_tournament(tournament_id):
    item, error = owned_tournament(tournament_id)
    if error: return error
    db.session.delete(item); db.session.commit()
    return jsonify({"deleted": True})

@app.get("/api/tournaments/<int:tournament_id>")
def public_tournament(tournament_id):
    item = db.session.get(Tournament, tournament_id)
    if not item: return json_error("Tournament not found", 404)
    return jsonify(tournament_json(item))

@app.post("/api/tournaments/<int:tournament_id>/registrations")
def create_registration(tournament_id):
    item = db.session.get(Tournament, tournament_id)
    if not item: return json_error("Tournament not found", 404)
    if not item.registration_open: return json_error("Registration is closed", 409)
    if len(item.registrations) >= item.slots: return json_error("Tournament slots are full", 409)
    data = request.get_json(silent=True) or {}
    team = str(data.get("team_name", "")).strip()
    captain = str(data.get("captain_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    if not team or len(team) > 100 or not captain or len(captain) > 100:
        return json_error("Team name and captain name are required")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return json_error("A valid email is required")
    if Registration.query.filter_by(tournament_id=item.id, email=email).first():
        return json_error("This email has already registered for the tournament", 409)
    reg = Registration(tournament_id=item.id, team_name=team, captain_name=captain, email=email,
                       contact=str(data.get("contact", ""))[:40], player_ids=str(data.get("player_ids", ""))[:1000])
    db.session.add(reg); db.session.commit()
    return jsonify({"id": reg.id, "team_name": reg.team_name, "status": reg.status, "message": "Registration received"}), 201

@app.get("/api/organizer/tournaments/<int:tournament_id>/registrations")
@auth_required
def list_registrations(tournament_id):
    item, error = owned_tournament(tournament_id)
    if error: return error
    return jsonify([{"id": r.id, "team_name": r.team_name, "captain_name": r.captain_name, "email": r.email,
                     "contact": r.contact, "player_ids": r.player_ids, "status": r.status,
                     "created_at": r.created_at.isoformat() if r.created_at else None} for r in item.registrations])

@app.patch("/api/organizer/registrations/<int:registration_id>")
@auth_required
def update_registration(registration_id):
    reg = db.session.get(Registration, registration_id)
    if not reg: return json_error("Registration not found", 404)
    if reg.tournament.owner_id != g.current_user.id: return json_error("You do not have access to this registration", 403)
    data = request.get_json(silent=True) or {}
    if "status" in data:
        if data["status"] not in ("pending", "approved", "rejected", "waitlisted"):
            return json_error("Status must be pending, approved, rejected or waitlisted")
        reg.status = data["status"]
    if "team_name" in data: reg.team_name = str(data["team_name"]).strip()[:100]
    db.session.commit()
    return jsonify({"id": reg.id, "team_name": reg.team_name, "status": reg.status})

@app.post("/api/organizer/tournaments/<int:tournament_id>/matches")
@auth_required
def create_match(tournament_id):
    item, error = owned_tournament(tournament_id)
    if error: return error
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    if not name: return json_error("Match name is required")
    match = Match(tournament_id=item.id, name=name[:120], match_date=str(data.get("match_date", ""))[:40])
    db.session.add(match); db.session.commit()
    return jsonify({"id": match.id, "name": match.name, "match_date": match.match_date}), 201

@app.put("/api/organizer/matches/<int:match_id>/results")
@auth_required
def upsert_match_results(match_id):
    match = db.session.get(Match, match_id)
    if not match: return json_error("Match not found", 404)
    if match.tournament.owner_id != g.current_user.id: return json_error("You do not have access to this match", 403)
    data = request.get_json(silent=True) or {}
    results = data.get("results")
    if not isinstance(results, list) or len(results) > 1000:
        return json_error("Results must be a list of at most 1000 entries")
    registration_ids = {r.id for r in match.tournament.registrations}
    for row in results:
        try:
            registration_id, placement, kills = int(row["registration_id"]), int(row.get("placement_points", 0)), int(row.get("kills", 0))
            if registration_id not in registration_ids or not 0 <= placement <= 100000 or not 0 <= kills <= 100000:
                raise ValueError()
        except (KeyError, TypeError, ValueError):
            db.session.rollback(); return json_error("Each result needs a valid registration_id and non-negative points/kills")
        score = MatchResult.query.filter_by(match_id=match.id, registration_id=registration_id).first()
        if score is None:
            score = MatchResult(match_id=match.id, registration_id=registration_id)
            db.session.add(score)
        score.placement_points, score.kills = placement, kills
    db.session.commit()
    return jsonify({"saved": len(results)})

@app.get("/api/tournaments/<int:tournament_id>/leaderboard")
def get_leaderboard(tournament_id):
    item = db.session.get(Tournament, tournament_id)
    if not item: return json_error("Tournament not found", 404)
    return jsonify({"tournament": {"id": item.id, "name": item.name, "game": item.game},
                    "scoring": "total = placement_points + kills", "standings": leaderboard_data(item)})

@app.errorhandler(404)
def not_found(_error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(_error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500

with app.app_context():
    # For the initial MVP, create tables on boot. Production upgrades should use migrations.
    db.create_all()
