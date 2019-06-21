

//	Function to determine if an object is empty
export const objectIsEmpty = (obj) => {
	return Object.entries(obj).length === 0 && obj.constructor === Object
}