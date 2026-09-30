# Project Architecture

- Interactive tool courses keep domain models/data/services under `src/lib/<tool>-lab` and UI under `src/components/<tool>-lab`; this keeps mock sandboxes replaceable by real backend APIs.