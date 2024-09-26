---
title: 'Mixing and Mastering With Ableton'
tags: ['music production', 'tracks']
dates:
  published: 2024-09-20
---

## Background

After mixing and mastering a few of my songs, I decided to document and
formalize my process so that it’s easier for me next time and maybe helpful for
others.

To keep this guide succinct, interesting decisions are explained in footnotes
and Ableton functionality is explained by linking to the
[Ableton Reference Manual](https://www.ableton.com/en/live-manual/12).

:::note

- This is not the only way to mix and master.
- Don't mindlessly follow this guide. Use your ears!
- If somethings sounds bad, then it's bad, regardless of what the guide says.

:::

## Mixing {#mixing}

1. Prepare

   1. Switch to
      [Arrangement View](https://www.ableton.com/en/live-manual/12/arrangement-view/#arrangement-view)
   2. Add a
      [Spectrum](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#spectrum)
      to the
      [Main track](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)
   3. Delete any unused tracks and name the rest
   4. Isolate important sounds with distinct frequencies in their own tracks
      (e.g. the kick drum)[^1]
      1. Mute the sound in its original track
      2. Add a new track
      3. [Route](https://www.ableton.com/en/live-manual/12/routing-and-i-o/#internal-routings)
         the unmuted sound from the original track to the new track
         1. Set Audio From to the sound from the original track (Post FX[^2])
         2. Set Monitor to In
   5. Sort the tracks
      1. Left
         1. Drums
         2. Percussion
         3. Bass
      2. Middle
         1. Melody
         2. Chords
         3. Harmony
      3. Right
         1. Sound effects and one shots
         2. Vocals
         3. [Return tracks](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)
   6. Create single track
      [groups](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks)
      for any tracks with
      [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
      [automation](https://www.ableton.com/en/live-manual/12/live-concepts/#automation-envelopes)[^3]
   7. Create
      [groups](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks)
      for any tracks that are parts of a larger whole (e.g. parts of a drum
      set)[^4]
   8. [Freeze](https://www.ableton.com/en/live-manual/12/computer-audio-resources-and-strategies/#track-freeze)
      any expensive or randomized tracks
   9. Switch to
      [Session View](https://www.ableton.com/en/live-manual/12/session-view/#session-view)
   10. Press Opt+Cmd+O to show the timeline

2. Add an
   [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)
   to each top-level track

   1. Cut unnecessary low frequencies (anything lower than 33Hz, or a little
      lower for drums and
      [sub-bass](https://en.wikipedia.org/wiki/Sub-bass))[^5] using a
      48dB/octave cut filter[^6]
   2. Cut bad sounding (e.g. metallic, squeaky, etc.) or excessively loud
      frequencies using a notch filter
      1. Use
         [Audition mode](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight:~:text=To%20temporarily%20solo%20a%20single%20filter%2C%20enable%20Audition%20mode%20via%20the%20headphone%20icon.%20In%20Audition%20mode%2C%20clicking%20and%20holding%20on%20a%20filter%20dot%20allows%20you%20to%20hear%20only%20that%20filter%E2%80%99s%20effect%20on%20the%20output.)
         to find bad frequencies
      2. Remove using a narrow band for deeper cuts or a wider band for shallow
         cuts[^7]

3. Add a
   [Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor)
   to each top-level track with transients that have greater than 5dB (loudest
   genres) to 15dB (quietest genres) between its RMS and peaks[^8]

   1. Enable
      [Makeup gain](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=Enabling%20the%20Makeup%20button%20automatically%20compensates%20the%20output%20level%20if%20the%20threshold%20and%20ratio%20settings%20change.)[^9]
   2. Set the mode to
      [Peak (compress brief peaks) or RMS (ignore brief peaks)](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=With%20Peak%20selected%2C%20Compressor,a%20slightly%20longer%20time.)
   3. Set the
      [Attack between 0.2ms and 30ms (lower to compress brief peaks) and set the Release to Auto](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=input%2Dlevel%20changes.-,Attack%20defines%20how%20long%20it%20takes%20to%20reach%20maximum%20compression%20once,the%20release%20time%20will%20adjust%20automatically%20based%20on%20the%20incoming%20audio.,-A%20slight%20amount)
   4. Set the
      [Threshold to the peak of the RMS (just “tickling” the tops) and adjust the Ratio](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=The%20Threshold%20slider,of%20the%20threshold.)
      until the dynamic range is acceptable (4:1 is a good starting point)
   5. Ensure there’s no distortion or clicking
      ([Attack](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=input%2Dlevel%20changes.-,Attack%20defines%20how%20long%20it%20takes%20to%20reach%20maximum%20compression%20once%20a%20signal%20exceeds%20the%20threshold,-%2C%20while%20Release%20sets)
      too fast)
   6. Ensure the
      [Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor)
      is not consistently active between transients
      ([Threshold](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=The%20Threshold%20slider%20sets%20where%20compression%20begins.)
      too low or
      [Attack](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=input%2Dlevel%20changes.-,Attack%20defines%20how%20long%20it%20takes%20to%20reach%20maximum%20compression%20once%20a%20signal%20exceeds%20the%20threshold,-%2C%20while%20Release%20sets)
      too fast)[^10]
   7. Ensure the
      [Gain Reduction](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=The%20orange%20Gain,its%20dynamic%20structure.)
      does not exceed 6dB
      ([Threshold](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=The%20Threshold%20slider%20sets%20where%20compression%20begins.)
      too low)[^11]

4. Add saturation (e.g.
   [Saturator](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#saturator),
   [Overdrive](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#overdrive),
   etc.) to each sound that needs more presence, harmonics, or warmth (good for
   lows)

5. Place each sound in the [stereo image](#imaging)

   1. Keep lows in the middle
   2. Use
      [Delay](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#delay),
      [Chorus-Ensemble](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#chorus-ensemble),
      and/or
      [Reverb](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#reverb)
      to widen narrow sounds
   3. Push mids and highs to the sides
      1. [Pan](https://www.ableton.com/en/live-manual/12/mixing/#mixing:~:text=The%20Pan%20control,others%20as%20well.)
         mids slightly and highs slightly more
      2. Use Mid/Side
         [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)
         1. Cut lows with a 12dB/octave cut filter and boost highs on the sides
         2. Cut frequencies in the middle to make space for important sounds
            (e.g. the snare)
         3. Increase
            [Gain](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight:~:text=As%20boosting%20will%20increase%20levels%20and%20cutting%20will%20decrease%20levels%2C%20use%20the%20global%20Gain%20slider%20to%20optimize%20the%20output%20level%20for%20maximum%20level%20consistent%20with%20minimum%20distortion.)
            to account for significant cuts
   4. Ensure sounds don’t mask each other
   5. Ensure sounds are not significantly diminished in mono (use
      [Utility](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#utility)
      set to
      [Mono](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#utility:~:text=When%20the%20Mono%20switch%20is%20enabled%2C%20the%20stereo%20input%20signal%20is%20converted%20to%20mono.)
      to check)[^12]

6. Sort sounds [backwards to forwards](#imaging)

   1. Aim to place sounds in the middle of the stereo image more forwards than
      sounds on the sides
   2. Mute all tracks
   3. Unmute the target most forwards sound (e.g. the kick drum in many genres)
      and adjust its
      [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
      to peak at –10dB
   4. For each remaining sound in the target forwards to backwards order
      1. Unmute the sound
      2. Adjust its
         [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
         to taste
   5. Ensure the
      [Main track](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)
      [Peak Level](https://www.ableton.com/en/live-manual/12/mixing/#mixing:~:text=resettable%20peak%20level%20indicators)
      is around –6dB

7. Export the whole track for mastering
   1. Switch to
      [Arrangement View](https://www.ableton.com/en/live-manual/12/arrangement-view/#arrangement-view)
   2. Press Cmd+A to select the whole track
   3. Press Cmd+L to set the
      [loop brace](https://www.ableton.com/en/live-manual/12/arrangement-view/#the-arrangement-loop)
   4. Press Cmd+Shift+R to
      [export](https://www.ableton.com/en/live-manual/12/managing-files-and-sets/#exporting-audio-and-video)
   5. Configure the options
      1. Selection
         1. Rendered Track: Main
      2. Rendering options
         1. Render as Loop: Off
         2. Convert to Mono: Off
         3. Normalize: Off
         4. Sample Rate: 44100 (or whatever your audio samples are using[^13])
      3. PCM
         1. Encode PCM: On
         2. File Type: WAV
         3. Bit Depth: 24
         4. Dither Options: No Dither[^14]
      4. MP3
         1. Encode MP3: Off

## Mastering

1. Prepare to master

   1. Create a new Live Set
   2. Switch to
      [Arrangement View](https://www.ableton.com/en/live-manual/12/arrangement-view/#arrangement-view)
   3. Delete any tracks other than a single audio track
   4. Press Cmd+0 to turn off launch quantization and press Cmd+4 to turn off
      [grid snapping](https://www.ableton.com/en/live-manual/12/arrangement-view/#using-the-editing-grid)[^15]
   5. Import the exported mixed track as an audio clip
   6. Ensure the audio clip is not
      [warped](https://www.ableton.com/en/live-manual/12/audio-clips-tempo-and-warping/#warping)[^16]
   7. Ensure there are no unexpected peaks in the waveform. If there are, then
      go back to [Mixing](#mixing) to fix

2. Position and trim the audio clip

   1. Position and trim the start of the clip
      1. Ensure there’s 150ms of silence before the first transient[^17]
      2. Apply a
         [fade](https://www.ableton.com/en/live-manual/12/arrangement-view/#audio-clip-fades-and-crossfades)
         from the start and up to, but not including, the first transient[^18].
         If you want to fade in silence, then you can add silence to the start
         of the clip:
         1. Select the clip
         2. Press Shift, click, and drag the selection to include the silence
         3. Press Cmd+J
   2. Position and trim the end of the clip
      1. Trim the end of the clip at the point where the
         [Main track](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)
         [Meter](https://www.ableton.com/en/live-manual/12/mixing/#mixing:~:text=The%20Meter%20shows%20both%20peak%20and%20RMS%20output%20levels%20for%20the%20track.)
         has an output level of zero[^19]
      2. Apply a
         [fade](https://www.ableton.com/en/live-manual/12/arrangement-view/#audio-clip-fades-and-crossfades)
         to the end, starting after the last transient[^20]
      3. Ensure there’s at least 500ms of silence after the last transient[^21]
   3. Set the
      [loop brace](https://www.ableton.com/en/live-manual/12/arrangement-view/#the-arrangement-loop)
      around the track, including any added silence at the start and end

3. Add an
   [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)
   to the
   [Main track](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)

   1. Cut unnecessary low frequencies (anything lower than 20Hz to 30Hz)[^22]
      using a 48dB/octave cut filter[^23]
   2. Cut bad sounding (e.g. metallic, squeaky, etc.) or excessively loud
      frequencies using a notch filter
      1. Use
         [Audition mode](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight:~:text=To%20temporarily%20solo%20a%20single%20filter%2C%20enable%20Audition%20mode%20via%20the%20headphone%20icon.%20In%20Audition%20mode%2C%20clicking%20and%20holding%20on%20a%20filter%20dot%20allows%20you%20to%20hear%20only%20that%20filter%E2%80%99s%20effect%20on%20the%20output.)
         to find bad frequencies
      2. Remove using a narrow band for deeper cuts or a wider band for shallow
         cuts[^24]
   3. Cut peaks greater than 10kHz using a shelf

4. Add a
   [Multiband Dynamics](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#multiband-dynamics)
   to the
   [Main track](https://www.ableton.com/en/live-manual/12/mixing/#return-tracks-and-the-main-track)

   1. Set to RMS mode
   2. Set the High, Mid, and Low frequency ranges
      1. Solo the High frequencies and set the range’s start frequency as low as
         possible while ensuring you can only hear the “shimmer”, and none of
         the “body”, of the sounds (2.5kHz–3kHz is usually good)
      2. Solo the Low frequencies and set the range’s end frequency as high as
         possible while ensuring you can’t hear the “body” of the sounds
         (100Hz–200Hz is usually good)
      3. Solo the Mid frequencies and ensure you can’t hear “shimmer” or
         sub-bass
   3. For the High, Mid, and Low compressors
      1. Solo the frequency range
      2. Apply downward compression
         1. Set the threshold to the peak of the RMS (just “tickling” the tops)
         2. Adjust the ratio to taste
            1. Up to 10dB of gain reduction for Highs and Mids
            2. Up to 2dB of gain reduction for Lows
      3. Maybe apply upward compression to taste
      4. Unsolo the frequency range
      5. Increase output gain to taste up to the max gain reduction
   4. Dial back the Amount to taste

5. Add a Mid/Side
   [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)

   1. Cut lows with a 12dB/octave cut filter (at 100Hz is usually good) from the
      sides
   2. Increase
      [Gain](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight:~:text=As%20boosting%20will%20increase%20levels%20and%20cutting%20will%20decrease%20levels%2C%20use%20the%20global%20Gain%20slider%20to%20optimize%20the%20output%20level%20for%20maximum%20level%20consistent%20with%20minimum%20distortion.)
      to account for significant cuts

6. Add a
   [Glue Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#glue-compressor)

   1. Set Attack to 0.1ms
   2. Set Release to 0.2ms
   3. Set Ratio to 4:1
   4. Lower the Threshold until the Compression Meter just barely moves for the
      peaks
   5. Enable Soft Clip limiting[^25]
   6. Increase Makeup gain until clipping barely flickers for the peaks
   7. Increase Makeup gain until the RMS peaks at –4dB (loudest genres) to –10dB
      (quietest genres)

7. Export the mastered track

   1. Click on the
      [loop brace](https://www.ableton.com/en/live-manual/12/arrangement-view/#the-arrangement-loop)
      that was set before
   2. Press Cmd+Shift+R to
      [export](https://www.ableton.com/en/live-manual/12/managing-files-and-sets/#exporting-audio-and-video)
   3. Configure the options
      1. Selection
         1. Rendered Track: Main
      2. Rendering options
         1. Render as Loop: Off
         2. Convert to Mono: Off
         3. Normalize: Off
         4. Sample Rate: whatever sample rate the exported mix tracked used[^26]
      3. PCM
         1. Encode PCM: On
         2. File Type: WAV
         3. Bit Depth: 24
         4. Dither Options: POW-r-1[^27]
      4. MP3
         1. Encode MP3: On (if you need one)

8. Spot check the exported track
   1. Import the exported mastered track as an audio clip in a new audio track
   2. Zoom in to the loudest parts of the track and ensure the clipping is
      soft/curved. If there are hard edges, then go back and decrease the Makeup
      gain on the Glue Compressor

## Appendix

### Defaults

See my
[default audio effect configurations on GitHub](https://github.com/TomerAberbach/ableton-library/tree/main).

### [Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor)

- Threshold: volume at which compression starts
- Ratio: how much to compress (1:1 for none; 1:inf for complete flattening)
- Attack: how quickly to start compression after exceeding the threshold
- Release: how to quickly to stop compression after falling below the threshold

### Imaging {#imaging}

- [Pan](https://www.ableton.com/en/live-manual/12/mixing/#mixing:~:text=The%20Pan%20control,others%20as%20well.)
  to move left or right
- [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
  to move backwards (decrease) or forwards (increase)
- [Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor)
  to move backwards (use
  [Makeup gain](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=Enabling%20the%20Makeup%20button%20automatically%20compensates%20the%20output%20level%20if%20the%20threshold%20and%20ratio%20settings%20change.)
  to move forwards again)
- [Saturator](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#saturator)
  to
  1. Move backwards (cool down) or forwards (warm up)
  2. Move up (warm up highs) or down (warm up lows)
- Stereo
  [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)
  to move up (highpass) or down (lowpass)
- Mid/Side
  [EQ Eight](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#eq-eight)
  to narrow (cut sides) or widen (cut mids)
- [Pan](https://www.ableton.com/en/live-manual/12/mixing/#mixing:~:text=The%20Pan%20control,others%20as%20well.)
  left and
  [Delay](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#delay)
  (less than 30 ms) right (or vice versa) to widen
- [Chorus-Ensemble](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#chorus-ensemble)
  to widen
- [Reverb](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#reverb)
  to place sound in a room

[^1]: Enables adding effects that apply to just that one sound.

[^2]: Preserves the effects that apply to the sound on the original track.

[^3]:
    Enables adjusting the track
    [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
    without disabling its
    [automation](https://www.ableton.com/en/live-manual/12/live-concepts/#automation-envelopes).

[^4]:
    Enables adding effects that apply to all the sounds in the larger whole
    together.

[^5]:
    Enables increasing the track's overall volume later. You can’t hear these
    really low frequencies anyway.

[^6]:
    We use 48dB/octave instead of 12dB/octave to ensure we’re cutting out all of
    these really low frequencies.

[^7]: We don’t want to accidentally cut good frequencies.

[^8]:
    Too much dynamic range within a single transient can complicate making the
    overall track loud.

[^9]: Keeps the RMS roughly the same after compression.

[^10]:
    If the
    [Compressor](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor)
    is always active, then it will sound unnatural.

[^11]:
    More than 6dB of
    [Gain Reduction](https://www.ableton.com/en/live-manual/12/live-audio-effect-reference/#compressor:~:text=The%20orange%20Gain,its%20dynamic%20structure.)
    can significantly alter or distort the sound.

[^12]:
    If the track is played on a mono speaker, then we still want it to sound
    good.

[^13]: Converting between sample rates can cause subtle distortion.

[^14]:
    We don’t need to dither now because we’ll dither when exporting the mastered
    track.

[^15]:
    We’ll be treating the mixed track as plain audio so we don’t want to be
    restricted to divisions of an arbitrary beat.

[^16]:
    We’ll be treating the mixed track as plain audio so we don’t want the audio
    to be stretched to align with divisions of an arbitrary beat.

[^17]:
    Ensures none of the track is cut off when played in software that fades
    songs in.

[^18]: Ensures there’s no click at the start of the track.

[^19]:
    Ensures none of the track is accidentally omitted and no accidental silence
    is added.

[^20]:
    Ensures the track
    [Volume](https://www.ableton.com/en/live-manual/12/mixing/#group-tracks:~:text=The%20Volume%20control%20adjusts%20the%20track%E2%80%99s%20output%20level.%20With%20multiple%20tracks%20selected%2C%20adjusting%20the%20volume%20of%20one%20of%20them%20will%20adjust%20the%20others%20as%20well.)
    output level does not abruptly drop to zero when the track ends.

[^21]:
    Ensures none of the track is cut off when played in software that fades
    songs out.

[^22]:
    Enables increasing the track's overall volume later. You can’t hear these
    really low frequencies anyway.

[^23]:
    We use 48dB/octave instead of 12dB/octave to ensure we’re cutting out all of
    these really low frequencies.

[^24]: We don’t want to accidentally cut good frequencies.

[^25]:
    Limits the volume to –0.5dB. We don’t limit it to 0dB because we’d
    [get distortion from intersample peaks when converting to MP3 or when playing the track on lower quality devices](https://splice.com/blog/what-are-inter-sample-peaks).

[^26]: Converting between sample rates can cause subtle distortion.

[^27]:
    Removes subtle distortion from
    [converting audio between different sample rates and bit depths](https://splice.com/blog/what-is-dithering-audio/).
