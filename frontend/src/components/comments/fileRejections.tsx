import { FileError, FileRejection, FileWithPath } from "react-dropzone";

const FileRejections = ({ files }: {
  files: FileRejection[];
}) => {
  // Component that receives the rejected files from Dropzone
  return (
    <ul>
      {files.map(({ file, errors }: {
        file: FileWithPath;
        errors: FileError[];
      }) => (
        <li key={file.path} className="red">
          {file.path} (
          {errors.map((e) => (
            <span key={e.code} className="dib pr2">
              {e.message},
            </span>
          ))}
          )
        </li>
      ))}
    </ul>
  );
};

export default FileRejections;
