import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { isValidEmail } from "@/lib/utils";
import {
  loadInputFromLocalStorage,
  loadLanguage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import { ComponentNames, InputFieldValues } from "@/lib/types";

export default function SignIn() {
  const [email, setEmail] = useState(
    () =>
      loadInputFromLocalStorage(
        InputFieldValues.email,
        ComponentNames.signIn
      ) || ""
  );
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [language] = useState<string>(() => loadLanguage());

  const navigate = useNavigate();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorMessage =
        error.message === "Invalid login credentials"
          ? language === "da"
            ? "Ugyldige loginoplysninger"
            : error.message
          : error.message;

      setErrorMsg(errorMessage);
    } else {
      navigate("/calculate-sheet-nesting");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 border rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {" "}
        {language === "da" ? "Log ind" : "Sign In"}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignIn();
        }}
        className="space-y-4"
      >
        <div>
          <Input
            placeholder="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              saveInputToLocalStorage(
                InputFieldValues.email,
                e.target.value,
                ComponentNames.signIn
              );
            }}
          />
        </div>
        <div>
          <Input
            placeholder={language === "da" ? "Kodeord" : "Password"}
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        <Button
          disabled={
            !isValidEmail(email) || password === "" || !password || !email
          }
          className="w-full mt-2"
          onClick={handleSignIn}
        >
          {language === "da" ? "Log ind" : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
