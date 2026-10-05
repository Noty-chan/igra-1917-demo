# Портреты · 5 октября 2026

Обычные портреты получены из предоставленного клиентом `Personazhi.rar`. Иллюстрация смерти Белозёрова предоставлена клиентом отдельно. Восемь остальных вариантов смерти созданы ImageGen с оригинальным портретом первым референсом и иллюстрацией Белозёрова вторым. Исходники преобразованы в WebP для сайта, без овальных рамок.

| Персонаж / переменная name | Обычный портрет | Отметка смерти |
| --- | --- | --- |
| Алексей Оболенский | obolensky.webp | obolensky-dead.webp |
| Иван Чернов | chernov.webp | chernov-dead.webp |
| Катя Лукина | katya.webp | katya-dead.webp |
| Николай Воронцов | vorontsov.webp | vorontsov-dead.webp |
| Отец Николай | father-nikolai.webp | father-nikolai-dead.webp |
| Павел Веденин | vedenin.webp | vedenin-dead.webp |
| Сенька | senka.webp | senka-dead.webp |
| Софья Розанова | rozanova.webp | rozanova-dead.webp |
| Константин Белозёров | belozerov.webp | belozerov-dead.webp (клиент) |

Все файлы находятся в `dist/assets/characters/`. Промпт ниже применён отдельно к первым восьми персонажам с подстановкой имени в `${name}`. Прозрачный фон отключён.

```text
Use case: style-transfer. Create the death-state portrait asset for a vampire tabletop game. Image 1 is the ${name} character portrait to transform. Image 2 is ONLY a style reference: sinister pure black and saturated blood red gothic expressionist print with skull-like facial distortion. Change Image 1 into that black/red death style while preserving its exact character silhouette, pose, hair/headwear outline, clothing, props, camera crop and rectangular portrait composition. Transform the face into a haunting skeletal distortion that still resembles this character. Keep female characters and elderly bearded characters recognizable, keep their hair, headscarf or beard outlines. High contrast crimson light and deep black shadows, distressed painterly marks; dark supernatural horror, no organs or explicit gore. Full rectangular art without oval frame, without border, no lettering, no labels, no watermark. Produce ONLY this one character's portrait, not a montage. Preserve source portrait aspect ratio approximately 4:5.
```

Портреты и варианты смерти проверены визуально. Оригиналы генераций сохраняются локально в каталоге Codex generated_images; для публикации используются указанные WebP.
