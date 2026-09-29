import AppRouter from './app/AppRouter'
import { AuthProvider } from './app/auth/AuthProvider'
import { QueryProvider } from './app/QueryProvider'


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
