

export default function PlayerShip() {
    return (
        <mesh>
                <boxGeometry args={[1, 1, 10]} />
                <meshPhysicalMaterial color="orange" />
            </mesh>
    );
}