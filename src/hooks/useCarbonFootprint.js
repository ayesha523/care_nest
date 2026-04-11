import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MB = 1024 * 1024;
const DEFAULT_EMISSION_FACTOR = 0.81; // g CO2 per MB transferred (Sustainable Web Design model)
const MOBILE_EMISSION_FACTOR = 0.75; // slightly lower average for mobile networks

const getConnectionType = () => {
  const connection =
    typeof navigator !== "undefined"
      ? navigator.connection || navigator.mozConnection || navigator.webkitConnection
      : null;
  return connection?.effectiveType || connection?.type || "4g";
};

const getEmissionFactor = (type) => {
  if (typeof type !== "string") {
    return DEFAULT_EMISSION_FACTOR;
  }

  if (type.includes("2g") || type.includes("3g") || type.includes("slow-2g")) {
    return MOBILE_EMISSION_FACTOR;
  }

  if (type.includes("4g") || type.includes("5g") || type === "wifi") {
    return DEFAULT_EMISSION_FACTOR;
  }

  return DEFAULT_EMISSION_FACTOR;
};

const getResourceBytes = (lastTimestamp) => {
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") {
    return { bytes: 0, count: 0, lastTimestamp };
  }

  const entries = performance.getEntriesByType("resource");
  if (!entries.length) {
    return { bytes: 0, count: 0, lastTimestamp };
  }

  let bytes = 0;
  let count = 0;

  for (const entry of entries) {
    if (entry.startTime <= lastTimestamp) {
      continue;
    }

    const size =
      entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0;

    if (size > 0) {
      bytes += size;
    }

    count += 1;
  }

  const latest = entries[entries.length - 1]?.startTime ?? lastTimestamp;
  return { bytes, count, lastTimestamp: Math.max(lastTimestamp, latest) };
};

const buildFootprint = (bytes, factor) => {
  const grams = (bytes / MB) * factor;
  const kilograms = grams / 1000;
  return {
    totalBytes: bytes,
    totalRequests: 0,
    estimatedCO2g: Number(grams.toFixed(4)),
    estimatedCO2kg: Number(kilograms.toFixed(6)),
  };
};

/**
 * useCarbonFootprint
 * Tracks browser network activity and produces an estimated CO2 footprint.
 *
 * @param {Object} [options]
 * @param {number} [options.pollingInterval=3000] - how often network timing is sampled
 */
export function useCarbonFootprint({ pollingInterval = 3000 } = {}) {
  const [networkBytes, setNetworkBytes] = useState(0);
  const [networkRequests, setNetworkRequests] = useState(0);
  const [connectionType, setConnectionType] = useState(getConnectionType());
  const lastTimestampRef = useRef(0);
  const originalFetchRef = useRef(null);
  const originalXhrSendRef = useRef(null);

  const emissionFactor = useMemo(
    () => getEmissionFactor(connectionType),
    [connectionType]
  );

  const footprint = useMemo(() => {
    const grams = (networkBytes / MB) * emissionFactor;
    return {
      totalBytes: networkBytes,
      totalRequests: networkRequests,
      estimatedCO2g: Number(grams.toFixed(4)),
      estimatedCO2kg: Number((grams / 1000).toFixed(6)),
      emissionFactor,
      connectionType,
    };
  }, [networkBytes, networkRequests, emissionFactor, connectionType]);

  const trackBytes = useCallback((bytes) => {
    if (typeof bytes !== "number" || bytes <= 0) {
      return;
    }
    setNetworkBytes((current) => current + bytes);
  }, []);

  const trackRequest = useCallback(() => {
    setNetworkRequests((current) => current + 1);
  }, []);

  const resetFootprint = useCallback(() => {
    setNetworkBytes(0);
    setNetworkRequests(0);
    lastTimestampRef.current = performance?.now ? performance.now() : 0;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setConnectionType(getConnectionType());
    lastTimestampRef.current = performance?.now ? performance.now() : 0;

    // Poll performance resource timing for new network transfers.
    const polling = window.setInterval(() => {
      const { bytes, count, lastTimestamp } = getResourceBytes(
        lastTimestampRef.current
      );
      lastTimestampRef.current = lastTimestamp;

      if (bytes > 0) {
        trackBytes(bytes);
      }

      if (count > 0) {
        setNetworkRequests((current) => current + count);
      }
    }, pollingInterval);

    // Wrap fetch to count requests and optionally infer bytes from content-length.
    const originalFetch = window.fetch;
    originalFetchRef.current = originalFetch;

    window.fetch = async (...args) => {
      trackRequest();
      const response = await originalFetch(...args);

      try {
        const contentLength = response.headers?.get("content-length");
        if (contentLength) {
          const parsedLength = Number(contentLength);
          if (!Number.isNaN(parsedLength) && parsedLength > 0) {
            trackBytes(parsedLength);
          }
        }
      } catch (error) {
        // ignore header parse failures
      }

      return response;
    };

    // Wrap XHR send to count requests.
    const originalXhrSend = window.XMLHttpRequest.prototype.send;
    originalXhrSendRef.current = originalXhrSend;

    window.XMLHttpRequest.prototype.send = function (...xhrArgs) {
      trackRequest();
      return originalXhrSend.apply(this, xhrArgs);
    };

    return () => {
      window.clearInterval(polling);
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
      if (originalXhrSendRef.current) {
        window.XMLHttpRequest.prototype.send = originalXhrSendRef.current;
      }
    };
  }, [pollingInterval, trackBytes, trackRequest]);

  return {
    footprint,
    connectionType,
    emissionFactor,
    trackBytes,
    trackRequest,
    resetFootprint,
  };
}
