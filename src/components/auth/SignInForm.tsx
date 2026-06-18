import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authApi, LoginPayload } from "../../services/authLogin";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function resetForm() {
    setLogin("")
    setPassword("")
  }

  //function that recup lofin and pasword on click
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true)
    try {
      const response = await authApi.login({
        use_login: login,
        use_pwd: password
      })

      navigate("/home")

      console.log("Django: ", response)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (errors: any) {
        setError(errors.use_login|| "Identifiants incorrect ou erreur serveurs.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
          </div>
          <div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Id <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input placeholder="type your idnetifiants"
                    id="username"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    name="username" />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password" id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to="#"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    onClick={resetForm}
                  >
                    Rest form
                  </Link>
                </div>
                <div className="error" style={{color: 'red'}}>
                  {error && <p>{error}</p>}
                </div>
                <div>
                  <Button className="w-full" size="sm" type="submit">
                    {loading ? "loading..." : "Log In"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
