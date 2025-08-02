# PiSecure Chat - Deployment Guide

## Render Deployment

To deploy this application on Render:

1. **Move Vite to Dependencies**: Before deploying, you need to temporarily move vite from devDependencies to dependencies in package.json:

```json
{
  "dependencies": {
    "vite": "^5.4.19",
    // ... other dependencies
  }
}
```

2. **Deploy to Render**:
   - Connect your GitHub repository to Render
   - Use the provided `render.yaml` configuration
   - Set environment variables as needed

3. **Environment Variables**:
   - `NODE_ENV`: production
   - `DATABASE_URL`: Your PostgreSQL connection string (if using database)
   - `PORT`: Will be automatically set by Render

## Alternative: Using the build script manually

If you encounter issues, you can manually build and deploy:

1. Run `npm run build` locally
2. Ensure the `dist` folder contains the built server files
3. Deploy the `dist` folder with `package.json` and `node_modules`

## Troubleshooting

If you get "Cannot find package 'vite'" error:
- Make sure vite is listed in dependencies (not devDependencies) for production builds
- Verify that the build process completed successfully
- Check that all required files are included in the deployment