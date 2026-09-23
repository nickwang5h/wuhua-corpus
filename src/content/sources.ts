import type { Source } from './schema';

export const sources = [
  {
    "id": "legacy-zhuangzi",
    "provider": "legacy",
    "url": null,
    "revision": null,
    "edition": null,
    "rights": {
      "status": "unverified",
      "license": null,
      "evidenceUrl": null,
      "verifiedAt": null
    },
    "processing": {
      "imported": false,
      "normalized": true,
      "punctuationModified": null,
      "manuallyVerified": false
    }
  },
  {
    "id": "legacy-laozi",
    "provider": "legacy",
    "url": null,
    "revision": null,
    "edition": null,
    "rights": {
      "status": "unverified",
      "license": null,
      "evidenceUrl": null,
      "verifiedAt": null
    },
    "processing": {
      "imported": false,
      "normalized": true,
      "punctuationModified": null,
      "manuallyVerified": false
    }
  },
  {
    "id": "legacy-lunyu",
    "provider": "legacy",
    "url": null,
    "revision": null,
    "edition": null,
    "rights": {
      "status": "unverified",
      "license": null,
      "evidenceUrl": null,
      "verifiedAt": null
    },
    "processing": {
      "imported": false,
      "normalized": true,
      "punctuationModified": null,
      "manuallyVerified": false
    }
  }
] satisfies Source[];
