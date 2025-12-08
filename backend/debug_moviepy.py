from moviepy import TextClip, ColorClip, CompositeVideoClip

print("Starting MoviePy TextClip Test...")

try:
    # Try to generate a simple text clip
    # We use a standard font like 'Arial' or 'verdao' which might not need ImageMagick if using the right backend?
    # Actually MoviePy TextClip almost always needs ImageMagick.
    
    print("Attempting to create TextClip...")
    txt_clip = TextClip(text="Test", font_size=70, color='white', size=(500, 200))
    print("TextClip created successfully.")
    
    # Try to write it
    print("Writing debug video...")
    txt_clip.save_frame("debug_frame.png", t=0)
    print("Frame saved successfully.")

except Exception as e:
    print("\nXXX ERROR OCCURRED XXX")
    print(e)
    print("XXX END ERROR XXX\n")
