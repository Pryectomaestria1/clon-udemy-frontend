import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain="dev-m5kswumrcd6lw7tg.us.auth0.com"
      clientId="KgSKdzzG6Y4DYVYsvAc1Wf4seR1KbBFQ"
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://dev-m5kswumrcd6lw7tg.us.auth0.com/api/v2/"
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
)
