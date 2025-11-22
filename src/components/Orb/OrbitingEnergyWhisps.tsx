// components/OrbitingEnergyWhisps.tsx
import WhispyEnergyLine from "./WhispyEnergyLine";

export default function OrbitingEnergyWhisps() {
  return (
    <group>
      {Array.from({ length: 12 }).map((_, i) => (
        <WhispyEnergyLine
          key={i}
          radius={1.2 + Math.random() * 0.3}
          color={["#ffcc33", "#ffee88", "#ffaa33", "#fff599"][i % 4]}
          speed={0.2 + Math.random() * 0.6}
        />
      ))}
    </group>
  );
}
