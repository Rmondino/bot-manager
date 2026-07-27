from fastapi import FastAPI

app = FastAPI(title="Bot Manager API")

@app.get("/")
def root():
    return {"status": "ok"}