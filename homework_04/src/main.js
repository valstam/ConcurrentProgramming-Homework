require("../opendsu-sdk/psknode/bundles/openDSU");

const fs = require("fs");

class OpenDSUClient {

    opendsu;
    resolver;
    keyssispace;
    templateSSI;
    dsuInstance;

    constructor() {
        this.opendsu = require("opendsu");
        this.resolver = this.opendsu.loadApi("resolver");
        this.keyssispace = this.opendsu.loadApi("keyssi");
        this.templateSSI = this.keyssispace.createTemplateSeedSSI('default');
    }

    async createDSU() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.resolver.createDSU(this.templateSSI, (err, dsuInstance) => {
                    this.dsuInstance = dsuInstance;
                    resolve();
                });
            })
        });
    }

    async writeFile(fileName, data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.dsuInstance.writeFile(fileName, JSON.stringify(data), (err) => {
                    if (err) {
                        reject(new Error('Error writing file'));
                        return;
                    }

                    console.log(`File ${fileName} written successfully!`);
                    resolve();
                });
            });
        });
    }

    async readFile(fileName) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.dsuInstance.getKeySSIAsString((err, keyidentifier) => {
                    this.resolver.loadDSU(keyidentifier, (err, anotherDSUInstance) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        anotherDSUInstance.readFile(fileName, (err, data)=>{
                            if (err) {
                                reject(err);
                                return;
                            }

                            const dataObject = data.toString();
                            resolve(dataObject);
                        });
                    });
                });
            });
        });
    }

    async deleteFile(fileName) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.dsuInstance.delete(fileName, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    console.log(`File ${fileName} deleted successfully`);
                    resolve();
                });
            });
        })
    }

    async readAllFilePaths() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.dsuInstance.getKeySSIAsString((err, keyidentifier) => {
                    this.resolver.loadDSU(keyidentifier, async (err, anotherDSUInstance) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const fileList = await $$.promisify(anotherDSUInstance.listFiles)('/');

                        resolve(fileList);
                    });
                });
            });
        });
    }

}

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const readInput = async (question) => {
    return new Promise((resolve, reject) => {
        rl.question(question, resolve);
    });
};

const UserActions = {
    READ_FILE: "read",
    WRITE_FILE: "write",
    UPLOAD_FILE: "upload",
    READ_ALL: "all",
}

async function readLocalFile(path) {
    if (!fs.existsSync(path)) {
        return null
    }

    return fs.readFileSync(path, 'utf8')
}

async function main() {
    const openDSUClient = new OpenDSUClient();
    await openDSUClient.createDSU();

    while (true) {
        console.log("Hello! The command are: read write upload all");
        const input = await readInput("Write your command: ");

        let fileName = null
        let filePath = null
        let fileData = null

        switch (input) {
            case UserActions.READ_FILE:
                fileName = await readInput("Insert file name: ");
                fileData = await openDSUClient.readFile(fileName);

                console.log(`The content of ${fileName} is:`);
                console.log(fileData);
                break;
            case UserActions.WRITE_FILE:
                fileName = await readInput("Insert file name: ");
                fileData = await readInput("Content of file: ")

                await openDSUClient.writeFile(fileName, fileData)
                break;
            case UserActions.UPLOAD_FILE:
                filePath = await readInput("Path to local file: ")

                fileName = filePath
                if (fileName.includes('\\')) {
                    fileName = filePath.split("\\")[filePath.split("\\").length - 1]
                }
                else if (fileName.includes("/")) {
                    fileName = filePath.split("/")[filePath.split("/").length - 1]
                }
                fileData = await readLocalFile(filePath)

                if (fileData != null) {
                    await openDSUClient.writeFile(fileName, fileData)
                }
                else {
                    console.log('File ' + filePath + ' does not exist!')
                }
                break;
            case UserActions.READ_ALL:
                const allFilesList = await openDSUClient.readAllFilePaths();

                if (allFilesList.length === 0) {
                    console.log('No files found');
                    break;
                }

                console.log('The list of the found:')
                for (const fileName of allFilesList) {
                    console.log(fileName);
                }

                break;
            default:
                console.log("Wrong command");
        }
    }

    // const data = {"message": "Hello world!"};
    //
    // await openDSUClient.writeFile('data1', data);
    // // const fileData = await openDSUClient.readFile('/data');
    // await openDSUClient.deleteFile('data1');
    //
    // const filePathsList = await openDSUClient.readAllFilePaths();
    // console.log(filePathsList);
}

main();