import { Composition } from 'remotion'

import { TraceliFilm } from './traceli-film'

export const RemotionRoot = () => {
  return (
    <Composition
      id="TraceliTenderToProof"
      component={TraceliFilm}
      durationInFrames={1320}
      fps={30}
      width={1280}
      height={720}
    />
  )
}
