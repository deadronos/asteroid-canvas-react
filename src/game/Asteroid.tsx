import { Vec3 } from './types';


export default function Asteroid(props: { position: Vec3 }) {

    return (
        <mesh position={[props.position]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="gray" />
        </mesh>
    );
}