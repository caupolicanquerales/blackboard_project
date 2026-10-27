---
name: react-model
description: "React Native (mobile) specific model/type conventions. Extends typescript-model."
---

# React Model Skill

- Place models in `src/shared/models/` or feature `src/features/<f>/data/` per architect plan
- Use plain TypeScript (`type` or `interface`); no decorators or class-based models
- Keep models UI-free: never import React Native components or hooks into a model file
- Navigation param lists (for example `RootStackParamList`) live in one `src/core/navigation/types.ts` file and are imported everywhere else
- Each type, union, or status enum is declared in exactly one file (one producer per type)
