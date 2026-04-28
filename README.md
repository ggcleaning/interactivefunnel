# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### 🚀 Launch Checklist

1. **Environment Variables**: Copy `.env.example` to `.env` and fill in your keys.
2. **Branding Assets**: All premium logo SVGs are in `/public`.
3. **CRM Integration**:
   - Set `VITE_LEAD_WEBHOOK_URL` to your GHL or Google Sheets webhook.
   - The site is pre-configured to send leads automatically.
4. **Stripe**: Update your Live Keys for production payments.

### 📄 Documentation
- [Setup Guide](file:///C:/Users/12132/.gemini/antigravity/brain/cf98e8eb-e9b8-410e-bc6b-1492dc12abaf/walkthrough.md)
- [Branding Identity](file:///C:/Users/12132/.gemini/antigravity/brain/cf98e8eb-e9b8-410e-bc6b-1492dc12abaf/logo_variations_guide.md)
on application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
