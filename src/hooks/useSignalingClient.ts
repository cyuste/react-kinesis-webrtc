import { useEffect, useState } from "react";
import { Role, SignalingClient } from "amazon-kinesis-video-streams-webrtc";
import { SignalingClientConfigOptions } from "../ConfigOptions";

/**
 * @description Creates and opens a signaling channel. Closes connection on cleanup.
 **/
export function useSignalingClient(
  config: SignalingClientConfigOptions
): {
  error: Error | undefined;
  signalingClient: SignalingClient | undefined;
} {
  const {
    channelARN,
    channelEndpoint,
    credentials: { accessKeyId = "", secretAccessKey = "" } = {},
    clientId,
    region,
    role,
    systemClockOffset,
  } = config;

  const [signalingClient, setSignalingClient] = useState<SignalingClient>();
  const [signalingClientError, setSignalingClientError] = useState<Error>();

  /** Create signaling client when endpoints are available. */
  useEffect(() => {
    if (!channelEndpoint) {
      return;
    }

    if (!clientId && role === Role.VIEWER) {
      return;
    }

    setSignalingClient(
      new SignalingClient({
        channelARN,
        channelEndpoint,
        clientId,
        credentials: { accessKeyId, secretAccessKey },
        region,
        role,
        systemClockOffset,
      })
    );
  }, [
    accessKeyId,
    channelARN,
    channelEndpoint,
    clientId,
    region,
    role,
    secretAccessKey,
    systemClockOffset,
  ]);

  /** Handle signaling client lifecycle. */
  useEffect(() => {
    let isCancelled = false;

    function handleSignalingClientError(error: Error) {
      console.error(error);
      if (isCancelled) {
        return;
      }
      setSignalingClientError(error);
    }

    signalingClient?.on("error", handleSignalingClientError);
    signalingClient?.open();

    return function cleanup() {
      isCancelled = true;

      signalingClient?.close();
      signalingClient?.off("error", handleSignalingClientError);
    };
  }, [signalingClient]);

  return { error: signalingClientError, signalingClient };
}
