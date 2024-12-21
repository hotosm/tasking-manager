import { FileRejection } from "react-dropzone";

const FileRejections = ({ files }: {
  files: FileRejection[]
}) => {
  // Component that receives the rejected files from Dropzone
  return (
    <ul>
      {files.map(({ file, errors }) => (
        <li key={file.name + errors[0].message} className="red">
          {file.name} (
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
