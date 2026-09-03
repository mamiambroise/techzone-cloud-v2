import LoginForm from '../../components/auth/LoginForm';

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-2">Connectez-vous a votre espace IAM</p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-400 mt-6">
          Comptes de test : admin / admin123
        </p>
      </div>
    </div>
  );
}

export default Login;
