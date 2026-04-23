
# --- Podcast Markdown Context (Singleton) ---
_podcast_markdown_threads = None

def build_markdown_threads(podcasts_df):
    """
    Build and cache the list of markdown strings, one per podcast.
    """
    global _podcast_markdown_threads
    markdown_threads = []
    for idx, row in podcasts_df.iterrows():
        md = f"""## Podcast: {row.get('name', '')}
**Categories:** {row.get('categories', '')}  
**Author:** {row.get('author', '')}  
**Description:**  
{row.get('descr', '')}
"""
        markdown_threads.append(md)
    _podcast_markdown_threads = markdown_threads
    return markdown_threads

def get_podcast_markdown_threads(max_context=10):
    """
    Return the cached podcast markdown threads (for RAG context).
    """
    if _podcast_markdown_threads is None:
        raise RuntimeError("Podcast markdown threads not built. Call build_markdown_threads(df) at startup.")
    return _podcast_markdown_threads[:max_context]

def format_rag_context(hits, markdown_threads, max_chars_total=120_000):
    """
    Build one LLM context string from search hits using full thread Markdown.
    Args:
        hits: List of dicts with 'doc_id', 'rank', 'title', 'score'.
        markdown_threads: List of markdown strings, indexed by doc_id.
        max_chars_total: Max characters for the combined string, or None for no cap.
    Returns:
        Prompt text for the LLM.
    """
    parts = []
    for h in hits:
        i = h["doc_id"]
        md = markdown_threads[i] if 0 <= i < len(markdown_threads) else ""
        parts.append(
            f"### [{h['rank']}] {h['title']}\n"
            f"score: {h['score']:.4f}\n\n---\n\n{md}\n"
        )
    text = "\n\n".join(parts)
    if max_chars_total is not None and len(text) > max_chars_total:
        return text[:max_chars_total] + "\n\n[truncated]"
    return text

def search_podcasts_and_episodes(query, markdown_threads, json_search_fn, top_k=5):
    """
    Wrapper around json_search to return hits in the format expected by RAG helpers.
    Args:
        query: User query string
        markdown_threads: List of markdown strings (podcasts first, then episodes)
        json_search_fn: Function to call for podcast search (should return list of podcast dicts)
        top_k: Number of results to return
    Returns:
        List of dicts with doc_id, rank, title, score
    """
    # Call the user's existing search function
    results = json_search_fn(query)
    hits = []
    # Podcasts are first in markdown_threads, so doc_id = podcast index
    for rank, podcast in enumerate(results[:top_k], 1):
        # Find doc_id by matching title and description in markdown_threads
        # (Assumes build_markdown_threads order is consistent)
        doc_id = None
        for i, md in enumerate(markdown_threads):
            if podcast['title'] in md and podcast['description'] in md:
                doc_id = i
                break
        if doc_id is None:
            doc_id = 0  # fallback to first
        hits.append({
            'doc_id': doc_id,
            'rank': rank,
            'title': podcast['title'],
            'score': podcast['score'],
        })
    return hits

def retrieve_for_rag(query, markdown_threads, json_search_fn, top_k=5, max_chars_total=120_000):
    """
    Run search, print a banner and hit list, then format context for the LLM.
    Returns: (hits, context)
    """
    print("\n" + "=" * 72)
    print(f" search_podcasts_and_episodes({query!r}, top_k={top_k})")
    print("=" * 72 + "\n")
    hits = search_podcasts_and_episodes(query, markdown_threads, json_search_fn, top_k=top_k)
    for h in hits:
        print(f" [{h['rank']}] {h['score']:.4f} {h['title'][:72]}")
    print()
    return hits, format_rag_context(hits, markdown_threads, max_chars_total)

def enrich_query_with_llm(user_query, client, json_search_fn, max_context=10):
    """
    Use LLM to rewrite/enrich the user query for improved retrieval,
    using the top-N scored podcast descriptions as RAG context.
    Returns the enriched query string.
    """
    # Get all markdown threads
    markdown_threads = get_podcast_markdown_threads(max_context=1000)  # get all
    # Run search to get top-N scored podcasts
    hits = search_podcasts_and_episodes(user_query, markdown_threads, json_search_fn, top_k=max_context)
    # Build context from top-N markdowns
    context = "\n\n---\n\n".join([markdown_threads[h['doc_id']] for h in hits])
    prompt_query_modification = [
        {"role": "system", "content": (
            "You are an expert podcast search assistant. "
            "Given the user's question and the following podcast descriptions, "
            "rewrite the question to maximize retrieval of relevant podcasts."
        )},
        {"role": "user", "content": (
            f"User question:\n{user_query}\n\n"
            f"Podcast descriptions:\n{context}"
        )}
    ]
    response = client.chat(prompt_query_modification, stream=False, show_thinking=False)
    modified_query = response["content"]
    return modified_query