import AppRouter from './app/AppRouter'
import { AuthProvider } from './app/auth/AuthProvider'
import { QueryProvider } from './app/QueryProvider'

import './App.css'

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
