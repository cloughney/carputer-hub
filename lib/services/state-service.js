import * as path from 'path';
import * as fs from 'fs';

const defaultState = {

};

class StateService {
    constructor(filename) {
        this._filename = path.resolve(filename);
        this._activeState = null;
    }

    async getState() {
        if (this._activeState === null) {
            try {
                this._activeState = await this._readStateFromFile();
            } catch {
                this._activeState = defaultState;
            }
        }

        return { ...this._activeState };
    }

    async saveState(stateUpdate) {
        const currentState = await this.getState();
        this._activeState = { ...currentState, ...stateUpdate };

        await this._saveStateToFile(this._activeState);
    }

    _readStateFromFile() {
        return new Promise((resolve, reject) => {
            fs.readFile(this._filename, (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(JSON.parse(data.toString()));
            });
        });
    }

    _saveStateToFile(state) {
        return new Promise((resolve, reject) => {
            fs.writeFile(this._filename, JSON.stringify(state),
                err => err ? reject(err) : resolve());
        })
    }
}

export default new StateService('./state.dat');