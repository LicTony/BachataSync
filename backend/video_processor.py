from moviepy import VideoFileClip, TextClip, CompositeVideoClip, ColorClip
import math

def process_video_file(input_path, output_path, bpm, offset, text_content):
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
                 stroke_width=2
             )
        except Exception as e:
             print(f"Error creating cache for {symbol}: {e}")

    # Add User Text (Top Center, Wrapped)
    try:
        # method='caption' enables wrapping to 'size'
        # align='center' centers the text within the box
        txt_clip = TextClip(
            text=text_content, 
            font_size=text_font_size, 
            color='white', 
            font='C:\\Windows\\Fonts\\arial.ttf', 
            method='caption', 
            size=(max_text_width, None), 
            align='center'
        )
        # Position: Center horizontally, margin from top
        txt_clip = txt_clip.with_position(('center', margin)).with_duration(video.duration)
        clips.append(txt_clip)
    except Exception as e:
        print(f"Error creating text clip: {e}")

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
