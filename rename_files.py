import os
import glob

def rename_pdf_files(directory_path):
    """
    Rename all PDF files in the specified directory to 'fuel bill_X.pdf' 
    where X is a sequential number.
    """
    # Find all PDF files in the directory
    pdf_files = glob.glob(os.path.join(directory_path, "*.pdf"))
    
    # Sort the files to ensure consistent renaming
    pdf_files.sort()
    
    # Rename each file
    for i, file_path in enumerate(pdf_files, start=1):
        new_name = os.path.join(directory_path, f"fuel bill_{i}.pdf")
        
        # Check if new_name already exists and avoid overwriting
        base_name = f"fuel bill_{i}"
        count = 1
        while os.path.exists(new_name):
            new_name = os.path.join(directory_path, f"{base_name}_{count}.pdf")
            count += 1
            
        try:
            os.rename(file_path, new_name)
            print(f"Renamed: {os.path.basename(file_path)} -> {os.path.basename(new_name)}")
        except Exception as e:
            print(f"Error renaming {file_path}: {e}")

if __name__ == "__main__":
    # Get the current directory (where this script is located)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Rename all PDF files in the directory
    rename_pdf_files(current_dir)
    print("File renaming complete!")
