import { useCallback, useState } from "react";

import {
  clearInputsFromLocalStorage,
  loadInputFromLocalStorage,
  saveInputToLocalStorage,
} from "@/lib/utils-local-storage";
import type { ComponentName, InputField } from "@/lib/types";

export function usePersistedInput(
  fieldKey: InputField,
  componentName: ComponentName,
  defaultValue = ""
) {
  const [value, setValue] = useState<string>(
    () => loadInputFromLocalStorage(fieldKey, componentName) ?? defaultValue
  );

  const update = useCallback(
    (nextValue: string) => {
      setValue(nextValue);
      saveInputToLocalStorage(fieldKey, nextValue, componentName);
    },
    [componentName, fieldKey]
  );

  const clear = useCallback(() => {
    setValue(defaultValue);
    clearInputsFromLocalStorage([fieldKey], componentName);
  }, [componentName, defaultValue, fieldKey]);

  return {
    value,
    setValue: update,
    clear,
  };
}
