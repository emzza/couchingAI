/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_WSP_ONLINE: string
  readonly VITE_API_WSP_LOCAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 