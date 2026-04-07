"""
Routes: React app serving and episode search API.

To enable AI chat, set USE_LLM = True below. See llm_routes.py for AI code.
"""
import json
from pathlib import Path
import pandas as pd
import numpy as np
import pickle
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import os
from flask import send_from_directory, request, jsonify
from models import db, Episode, Review, Podcast

# ── AI toggle ────────────────────────────────────────────────────────────────
USE_LLM = False
# USE_LLM = True
# ─────────────────────────────────────────────────────────────────────────────

# Open at server startup
OS_PATH = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(OS_PATH, 'data/svd_shows.pkl'), 'rb') as f:
    svd_model = pickle.load(f) 
    
# shape: (n_podcasts, 100)
embeddings = np.load(os.path.join(OS_PATH, 'data/embeddings/description_embeddings.npy'))
show_ids = Path(os.path.join(OS_PATH, 'data/embeddings/embedding_show_ids.txt')).read_text().splitlines()
df = pd.read_csv(os.path.join(OS_PATH, 'data/podcasts.csv'))

def query_to_vec(query):
    if not query or not query.strip():
        query = "Joe Rogan Podcast"
    
    # Get embedding for query
    query_vec = svd_model['svd'].transform(svd_model['tfidf'].transform([query]))
    vec = query_vec[0]  # shape: (100,)
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec

# TODO: use cosine similarity and return top 5 matches instead of all matches
def json_search(query, explicit=False, genres=[], publisher='', release_year=None, length_metric=None, max_length=None):
    query_vec = query_to_vec(query)
    scores = cosine_similarity(query_vec.reshape(1, -1), embeddings)[0]
    id_to_score = dict(zip(show_ids, scores))
    
    # Get Podcasts and apply filters
    q = db.session.query(Podcast)
    
    if not explicit:
        q = q.filter(Podcast.explicit == False)
    if genres:
        for genre in genres:
            q = q.filter(Podcast.categories.ilike(f'%{genre}%'))
    if publisher:
        q = q.filter(Podcast.owner_name.ilike(f'%{publisher}%'))
    if release_year:
        q = q.filter(Podcast.newest_item_date != None).filter(
            Podcast.newest_item_date.between(f'{release_year}-01-01', f'{release_year}-12-31')
        )
    if length_metric and max_length is not None:
        if length_metric == 'duration_ms':
            q = q.filter(Podcast.avg_duration_min <= max_length)
        if length_metric == 'total_episodes':
            q = q.filter(Podcast.episode_count <= max_length)
        # TODO: popularity?
    podcasts = q.all()
    
    # add scores and sort
    results = sorted(
        [{'podcast': p, 'score': id_to_score.get(str(p.id), 0.0)} for p in podcasts], key=lambda x: x['score'], reverse=True
    )[:20]
    
    return (
        [{
            'title': r['podcast'].name,
            'description': r['podcast'].descr,
            'categories': r['podcast'].categories,
            'explicit': r['podcast'].explicit,
            'image_url': r['podcast'].image_url,
            'feed_url': r['podcast'].feed_url,
            'website_url': r['podcast'].website_url,
            'author': r['podcast'].author,
            'score': round(float(r['score']), 4),
            'popularity': r['podcast'].popularity_score,
        } for r in results]
    )


def register_routes(app):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    @app.route("/api/config")
    def config():
        return jsonify({"use_llm": USE_LLM})

    @app.route("/api/episodes")
    def episodes_search():
        text = request.args.get("title", "")
        return jsonify(json_search(text))
    
    @app.route("/api/podcasts")
    def podcasts_search():
        query       = request.args.get('query', '')
        explicit    = request.args.get('explicit', 'false') == 'true'
        genres      = request.args.getlist('genres')       # list
        publisher   = request.args.get('publisher', '')
        year        = request.args.get('releaseYear', '')
        length_met  = request.args.get('lengthMetric', '')
        max_length  = request.args.get('maxLength', type=float)
        return jsonify(json_search(
            query=query,
            explicit=explicit,
            genres=genres,
            publisher=publisher,
            release_year=year,
            length_metric=length_met,
            max_length=max_length
        ))

    if USE_LLM:
        from llm_routes import register_chat_route
        register_chat_route(app, json_search)
