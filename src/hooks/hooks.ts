import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { useState, useEffect } from "react";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export type DispatchFunc = () => AppDispatch;
export const useAppDispatch: DispatchFunc = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export interface SelectorParams {
  [key: string]: string | number | boolean | string[];
}

// Define the selector function type that accepts state and params
export type ParameterizedSelector<
  TSelected,
  TParams extends SelectorParams = SelectorParams
> = (state: RootState, params: TParams) => TSelected;

export function useAppSelectorWithParams<
  TSelected,
  TParams extends SelectorParams
>(
  selector: ParameterizedSelector<TSelected, TParams>,
  params: TParams
): TSelected {
  return useAppSelector((state) => selector(state, params));
}

export function useDebounceValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useOnClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: (e: MouseEvent) => void
) {
  useEffect(
    () => {
      const listener = (event: MouseEvent) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.currentTarget as Node)) {
          return;
        }

        handler(event);
      };

      document.addEventListener("mousedown", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler]
  );
}
