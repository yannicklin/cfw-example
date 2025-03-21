export function scriptContent() {
  function exec() {
    console.log("I'm a script injected from a service binding");
  }
  exec();
}
