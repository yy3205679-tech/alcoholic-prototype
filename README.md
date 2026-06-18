# alcoholic prototype

This repository contains:

- `alcoholic-publish/`: static mobile prototype
- `cutout-api/`: public cutout API for deployment on Render/Railway

## Static preview

Open:

```text
alcoholic-publish/index.html
```

## Configure public cutout API

After deploying `cutout-api`, edit:

```text
alcoholic-publish/config.js
```

Set:

```js
window.ALCOHOLIC_CUTOUT_ENDPOINT = "https://your-service-domain/api/cutout";
```

Then redeploy the static page.

## Deploy cutout API

Use `cutout-api/` as the service root.

Build command:

```bash
pip install -r requirements.txt
```

Start command:

```bash
python cutout-service.py
```

Required environment variable:

```text
REMOVE_BG_API_KEY=your_remove_bg_key
```
