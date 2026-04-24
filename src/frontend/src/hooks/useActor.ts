import { ExternalBlob, createActor } from "@/backend";
import type { Backend } from "@/backend";
import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";

// Upload/download stubs — actual object storage handled by blob-storage layer
const uploadFile = async (_file: ExternalBlob): Promise<Uint8Array> =>
  new Uint8Array();
const downloadFile = async (_file: Uint8Array): Promise<ExternalBlob> =>
  ExternalBlob.fromURL("");

export function useActor() {
  return useCaffeineActor<Backend>((canisterId, _upload, _download, options) =>
    createActor(canisterId, uploadFile, downloadFile, options),
  );
}
