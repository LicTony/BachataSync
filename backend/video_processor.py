from moviepy import VideoFileClip, TextClip, CompositeVideoClip, ColorClip
import math

def process_video_file(input_path, output_path, bpm, offset, text_content, timed_texts=[]):
    """
    Overlays a bachata step counter and custom text on the video.
    """
    video = VideoFileClip(input_path)
    
    # Calculate beat calculation
    # BPM = Beats per minute
    # 60 / BPM = seconds per beat
    spb = 60.0 / bpm 
    
    # Bachata sequence: 1, 2, 3, T, 5, 6, 7, T
    # The 'T' (Tap) is on beat 4 and 8.
    cycle = ["1", "2", "3", "T", "5", "6", "7", "T"]
    
    clips = [video]
    
    # Pre-generate clips for optimization
    # We create one clip for each unique symbol to avoid overhead
    clip_cache = {}
    unique_symbols = list(set(cycle))
    
    # Dynamic styling based on video dimensions
    video_w = video.w
    video_h = video.h
    
    # 1. Calculate dynamic margin (5% of height)
    margin = int(video_h * 0.05)
    
    # 2. Calculate dynamic font sizes
    # Main text: ~1/15th of width, Counter: ~1/8th of width
    text_font_size = int(video_w / 15)
    count_font_size = int(video_w / 8)
    
    # 3. Define max width for text (90% of video width) to prevent cutoff
    max_text_width = int(video_w * 0.9)

    # Pre-generate font clips with dynamic size
    print("Pre-generating font clips...")
    for symbol in unique_symbols:
        try:
             col = 'red' if symbol == 'T' else 'white'
             # Use dynamic count_font_size
             clip_cache[symbol] = TextClip(
                 text=symbol, 
                 font_size=count_font_size, 
                 color=col, 
                 font='C:\\Windows\\Fonts\\arial.ttf', 
                 stroke_color='black', 
                 stroke_width=2,
                 method='caption',
                 size=(int(count_font_size*1.5), int(count_font_size*1.5)),
                 text_align='center'
             )
        except Exception as e:
             print(f"Error creating cache for {symbol}: {e}")

    # Add User Text (Top Center, Wrapped)
    if text_content:
        try:
            # method='caption' enables wrapping to 'size'
            # align='center' centers the text within the box
            txt_clip = TextClip(
                text=text_content + "\n", 
                font_size=text_font_size, 
                color='white', 
                font='C:\\Windows\\Fonts\\arial.ttf', 
                method='caption', 
                size=(max_text_width, None), 
                text_align='center'
            )
            # Position: Center horizontally, margin from top
            txt_clip = txt_clip.with_position(('center', margin)).with_duration(video.duration)
            clips.append(txt_clip)
        except Exception as e:
            print(f"Error creating text clip: {e}")

    # Add Timed Texts
    for t_text in timed_texts:
        try:
            content = t_text.get('content', '')
            start = float(t_text.get('start', 0))
            end = float(t_text.get('end', 5))
            position = t_text.get('position', 'bottom')
            duration = end - start
            
            if duration <= 0: continue

            # For timed texts we use a slightly larger font? or same? 
            # Let's use similar to main text but maybe slightly larger as they are overlays
            overlay_font_size = int(video_w / 20) 

            t_clip = TextClip(
                text=content + "\n",
                font_size=overlay_font_size,
                color='white', # Maybe different color?
                font='C:\\Windows\\Fonts\\arial.ttf',
                method='caption',
                size=(max_text_width, None),
                text_align='center'
            )
            
            # Determine Position
            pos = ('center', 'bottom') # Default
            if position == 'top':
                # Avoid overlapping with main title if it exists, maybe add more margin?
                # Main title is at margin. So let's push it down a bit or assume they know what they are doing.
                # Actually, main title is fixed. If they put timed text at top, it might overlap.
                # For now let's put it at 2*margin to attempt to clear title
                pos = ('center', margin * 2.5) 
            elif position == 'center':
                pos = ('center', 'center')
            elif position == 'bottom':
                # Counter is at bottom. Counter takes up about clip_h + margin.
                # Beat counter pos_y = video_h - margin - clip_h
                # So we should be above that.
                # Let's approximate counter height as video_w/8
                counter_h = int(video_w / 8)
                bottom_margin = margin + counter_h + int(video_h * 0.05) # Extra spacing
                pos = ('center', video_h - bottom_margin - (t_clip.h or 100))
            
            t_clip = t_clip.with_position(pos).with_start(start).with_duration(duration)
            clips.append(t_clip)

        except Exception as e:
            print(f"Error processing timed text {t_text}: {e}")

    # Generate counter clips loop
    current_time = offset
    beat_index = 0
    
    while current_time < video.duration:
        symbol = cycle[beat_index % 8]
        item_duration = spb * 0.9 
        
        if symbol in clip_cache:
            clip_h = clip_cache[symbol].h
            # Position: Center horizontally, margin from bottom
            pos_y = video_h - margin - clip_h
            
            count_clip = clip_cache[symbol].with_start(current_time).with_duration(item_duration).with_position(('center', pos_y))
            clips.append(count_clip)
        
        current_time += spb
        beat_index += 1

    final_video = CompositeVideoClip(clips)
    
    # Write output
    final_video.write_videofile(output_path, codec="libx264", audio_codec="aac")
    
    video.close()
