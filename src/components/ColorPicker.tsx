import { PRESET_COLORS } from "@/lib/forms";

/** Selector de color como grupo de radios (campo "color"). */
export function ColorPicker({ defaultColor = PRESET_COLORS[0] }: { defaultColor?: string }) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Color</legend>
      {PRESET_COLORS.map((color) => (
        <label key={color} className="cursor-pointer">
          <input type="radio" name="color" value={color} defaultChecked={color === defaultColor} className="peer sr-only" />
          <span
            className="block size-8 rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-foreground"
            style={{ backgroundColor: color }}
          />
        </label>
      ))}
    </fieldset>
  );
}
