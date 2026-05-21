# KingSteam

A custom Shopify theme for the KingSteam store.

## Structure

| Folder | Description |
|--------|-------------|
| `assets/` | CSS, JS, and image files |
| `blocks/` | Theme blocks |
| `config/` | Theme settings schema |
| `layout/` | Base layout templates |
| `locales/` | Translation files |
| `sections/` | Page sections |
| `snippets/` | Reusable Liquid snippets |
| `templates/` | Page templates |

## Development

1. Install the [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli)
2. Log in to your store:
   ```bash
   shopify theme dev --store your-store.myshopify.com
   ```
3. Edit templates in `templates/`, sections in `sections/`, and styles in `assets/`

## Deployment

```bash
shopify theme push
```

## License

All rights reserved.
