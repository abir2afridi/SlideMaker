import { TextSection, HANDWRITING_STYLES, INK_COLORS } from '@/lib/handwriting/types';
import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

interface HandwritingRendererProps {
  section: TextSection;
  scale: number;
  inkSmudge: boolean;
}

function hash(a: number, b: number, c: number) {
  const h = Math.sin(a * 127.1 + b * 311.7 + c * 73.9) * 43758.5453;
  return h - Math.floor(h);
}

function getWordSpacing(wordIdx: number, lineIdx: number, seed: number) {
  return (hash(wordIdx * 3, lineIdx * 7, seed) - 0.5) * 3;
}

export const HandwritingRenderer = React.memo(({ section, scale, inkSmudge }: HandwritingRendererProps) => {
  const style = HANDWRITING_STYLES.find(s => s.id === section.styleId);
  const color = INK_COLORS.find(c => c.id === section.colorId);
  const colorValue = section.customColor || color?.value || '#1a5276';
  const seed = useMemo(() => section.id.charCodeAt(0) + (section.id.length > 0 ? section.id.charCodeAt(section.id.length - 1) : 0), [section.id]);

  const lines = (section.content || '').split('\n');

  const baseFontSize = section.isHeading
    ? (section.headingLevel === 1 ? 28 : section.headingLevel === 2 ? 24 : 20)
    : 18;

  const getLineDrift = (lineIdx: number) => (hash(0, lineIdx, seed + 99) - 0.5) * 1.5 * scale;

  return (
    <div className={cn(inkSmudge && "ink-smudge")} style={{ position: 'relative' }}>
      {/* Positionable diagrams */}
      {section.images && section.images.map((img, imgIdx) => (
        <img
          key={imgIdx}
          src={img.url}
          alt={`Diagram ${imgIdx + 1}`}
          style={{
            position: 'absolute',
            left: img.x * scale,
            top: img.y * scale,
            width: img.width * scale,
            height: img.height * scale,
            objectFit: 'contain',
            borderRadius: 4 * scale,
            zIndex: 5,
          }}
        />
      ))}

      {lines.map((line, lineIdx) => {
        const lineDrift = getLineDrift(lineIdx);
        const words = line.split(/( )/);

        return (
          <div
            key={lineIdx}
            className={cn(style?.fontClass)}
            style={{
              fontSize: `${baseFontSize * scale}px`,
              lineHeight: `${32 * scale}px`,
              fontWeight: section.isHeading ? 600 : 400,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              transform: `translateY(${lineDrift}px)`,
            }}
          >
            {line.length === 0 ? (
              <span>&nbsp;</span>
            ) : (
              words.map((word, wordIdx) => {
                if (word === ' ') {
                  const extraSpace = getWordSpacing(wordIdx, lineIdx, seed);
                  return (
                    <span
                      key={`sp-${wordIdx}`}
                      style={{
                        display: 'inline-block',
                        width: `${(0.3 * baseFontSize * scale) + extraSpace * scale}px`,
                      }}
                    />
                  );
                }

                return (
                  <span key={wordIdx} style={{ display: 'inline-flex' }}>
                    {word.split('').map((char, charIdx) => {
                      const globalCharIdx = wordIdx * 10 + charIdx;
                      const v = hash(globalCharIdx, lineIdx, seed);
                      const rotation = (v - 0.5) * 4;
                      const yShift = (hash(globalCharIdx + 1, lineIdx, seed) - 0.5) * 2.5 * scale;
                      const scaleVar = 0.94 + hash(globalCharIdx + 2, lineIdx, seed) * 0.12;
                      const pressure = 0.78 + hash(globalCharIdx + 3, lineIdx, seed) * 0.22;
                      const strokeThickness = hash(globalCharIdx + 4, lineIdx, seed) * 0.4 * scale;
                      const xShift = (hash(globalCharIdx + 5, lineIdx, seed) - 0.5) * 0.8 * scale;
                      const letterGap = (hash(globalCharIdx + 6, lineIdx, seed) - 0.5) * 0.6 * scale;

                      return (
                        <span
                          key={charIdx}
                          style={{
                            color: colorValue,
                            display: 'inline-block',
                            transform: `rotate(${rotation}deg) translate(${xShift}px, ${yShift}px) scale(${scaleVar})`,
                            opacity: pressure,
                            marginRight: `${letterGap}px`,
                            textShadow: strokeThickness > 0.2
                              ? `${strokeThickness}px 0 0 ${colorValue}`
                              : 'none',
                            transition: 'none',
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </span>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
});
