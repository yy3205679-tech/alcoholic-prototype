# Alcoholic Cutout API

Public cutout API for the alcoholic prototype.

## Deploy on Render

1. Create a new Web Service.
2. Use this folder as the service root.
3. Build command:
   ```bash
   pip install -r requirements.txt
   ```
4. Start command:
   ```bash
   python cutout-service.py
   ```
5. Add environment variable:
   ```text
   REMOVE_BG_API_KEY=your_remove_bg_key
   ```

Health check:

```text
GET /health
```

Cutout endpoint:

```text
POST /api/cutout
```

The request field name must be `image`.
