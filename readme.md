# nova-hooks

A lightweight event tracking utility for capturing user interactions (such as button clicks and page visits) in React applications. Built with `EventEmitter` and `socket.io-client`.

---

## ✨ Features

- Emits structured user activity events
- Supports click and page visit tracking
- Timestamp and project metadata included
- Easily extendable and customizable
- No external analytics service required

---

## 🚀 Getting Started

### 1. Install

```bash
yarn add nova-hooks@https://github.com/mjjabarullah/nova-hooks.git
```

```bash
npm i nova-hooks@https://github.com/mjjabarullah/nova-hooks.git
```

### Usage with `useGlobalClickTracker` hook

If you want to track the click event after login. use useGlobalClickTracker hook
Click event tracking ensures we capture user interactions within authenticated areas, helping analyze feature usage and behavior.

```tsx
import { useGlobalClickTracker } from "nova-hooks";

const Protected = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, user } = useAuth();
  // this hook tracks all the UI click
  useGlobalClickTracker(
    import.meta.env.VITE_APP_SOCKET,
    "WolfPack",
    user?.empId,
    user?.roleId
  );

  return isAuthenticated ? children : <Navigate to={RouteName.LOGIN} />;
};
```

add data-nova-track-id, data-nova-track-type attributes in UI elements to track click event internally.

```tsx
<Button
  data-nova-track-id="New Task"
  data-nova-track-type={ActionType["Button"]}
  size="sm"
  className="bg-primary hover:bg-primary_hover flex h-8 w-full items-center justify-center gap-2 sm:h-7 sm:w-auto"
  onClick={() => setOpen(true)}
>
  <BadgePlusIcon className="h-4 w-auto" />
  <span>
    <span className="md:hidden">New</span> Task
  </span>
</Button>
```

### Usage with `withEvent` , `connectSocket` methods

Or Would like to track explicit click event or somewhere, We need to use withEvent method

> [!IMPORTANT]
> Ensure socket connection established in react hook by using connectSocket method.

```tsx
const Login = () => {
  useEffect(() => {
    connectSocket(import.meta.env.VITE_APP_SOCKET, "WolfPack");
  }, []);

  const [_, setToken] = useSessionStorage<string | undefined>(
    Auth.SESSION,
    undefined
  );

  const { mutate: doLogin, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setToken(data.token);
      toast.success("Logged in successfully");
    },
    onError: (e) => {
      toast.error("Invalid username or password");
    },
  });

  const form = useForm<Login>({
    defaultValues: {
      employeeId: "",
      password: "",
    },
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = (data: Login) =>
    doLogin({ ...data, employeeId: data.employeeId.toUpperCase() });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full flex-col items-center justify-center gap-4 text-sm"
      >
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-black">Username</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <Input
                    {...field}
                    disabled={isPending}
                    className="h-11 outline-hidden focus-visible:ring-[0.7px]"
                    type="text"
                    placeholder="Enter Username"
                    maxLength={10}
                  />
                </div>
              </FormControl>
              <FormMessage className="ml-1 text-[12px] text-red-500" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-black">Password</FormLabel>
              <FormControl>
                <div className="relative flex items-center">
                  <PasswordInput
                    {...field}
                    disabled={isPending}
                    className="h-11 outline-hidden focus-visible:ring-[0.7px]"
                    placeholder="Enter Password"
                  />
                </div>
              </FormControl>
              <FormMessage className="ml-1 text-[12px] text-red-500" />
            </FormItem>
          )}
        />
        <Button
          size="sm"
          disabled={isPending}
          className="bg-primary mt-2 h-10 w-full cursor-pointer rounded-xl px-4"
          onClick={() =>
            // this function send an event to event tracker
            withEvent({
              Action: ActionType.Login,
              ActionType: ActionType.Login,
              EmpId: form.getValues("employeeId"),
              EmpRole: "",
              Count: 1,
            })
          }
        >
          {isPending && <Loader className="size-4" />}
          Login
        </Button>
      </form>
    </Form>
  );
};
```

## 📦 Exports

| Name                    | Type                                                                                | Description                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ActionType`            | `object`                                                                            | Predefined enum-like values: `"Button"`, `"Menu"`, `"Login"`                                           |
| `PageVisitAction`       | `string`                                                                            | Constant string `"Page Visit"` used for tracking page visits                                           |
| `setProjectName`        | `(name: string) => void`                                                            | Sets the global project name used in emitted events                                                    |
| `withEvent`             | `(eventData: EventData, callback?: Function) => void`                               | Emits a structured event optionally after running a callback                                           |
| `EventData`             | `type` (union of two objects)                                                       | Type definition for tracking click events or page visits (see below)                                   |
| `useGlobalClickTracker` | `(socketUrl: string, projectName: string, empId?: string, roleId?: string) => void` | React hook to track global click events and emit them to the server via socket.                        |
| `usePageTimeTracker`    | `(params: { Action: string; EmpId?: string; EmpRole?: string }) => void`            | React hook to track time spent on a page and emit an event on unmount if duration exceeds threshold.   |
| `PageTimeTrackingData`  | `type`                                                                              | Type definition for the parameters accepted by `usePageTimeTracker`.                                   |
| `socket`                | `ReturnType<typeof io>`                                                             | Socket.IO client instance used for real-time event communication.                                      |
| `connectSocket`         | `(socketUrl: string, projectName: string) => void`                                  | Connects to the socket server, sets the project name, and attaches connection/disconnection listeners. |

### EventData

| Property     | Type                                                              | Description                                                         |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `ActionType` | `keyof typeof ActionType` \| `typeof PageVisitAction`             | Type of the action (either from `ActionType` or `PageVisitAction`). |
| `Action`     | `string`                                                          | Specific action performed.                                          |
| `EmpId`      | `string`                                                          | Unique identifier of the employee.                                  |
| `EmpRole`    | `string`                                                          | Role of the employee performing the action.                         |
| `Count`      | `number` _(only when `ActionType` is from `ActionType`)_          | Number of occurrences of the action.                                |
| `Duration`   | `number` _(seconds, only when `ActionType` is `PageVisitAction`)_ | Duration of the visit in seconds.                                   |
