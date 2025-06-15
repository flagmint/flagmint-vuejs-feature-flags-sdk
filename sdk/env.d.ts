interface ImportMetaEnv {
  readonly DEV?: boolean
  // add any other custom env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
