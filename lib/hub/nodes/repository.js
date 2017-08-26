class NodeRepository {
	constructor() {
		this._nodes = [];
		this._nodeTypeMap = new Map();
	}

	add(node) {
		const nodes = this._nodeTypeMap.get(node.type) || [];
		nodes.push(node);
		this._nodeTypeMap.set(node.type, nodes);
		this._nodes.push(node);
	}

	remove(node) {
		this._nodes.splice(this._nodes.indexOf(node), 1);

		const typedNodes = this._nodeTypeMap.get(node.type) || [];
		typedNodes.splice(typedNodes.indexOf(node), 1);
	}

	*[Symbol.iterator]() {
		for (let node of this._nodes) {
			yield node;
		}
	}
}

module.exports = NodeRepository;
