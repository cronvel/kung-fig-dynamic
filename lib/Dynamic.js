/*
	Kung Fig Dynamic

	Copyright (c) 2015 - 2020 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



function Dynamic() { throw new Error( 'Dynamic should be derived' ) ; }
module.exports = Dynamic ;

Dynamic.prototype.__prototypeUID__ = 'kung-fig/Dynamic' ;
Dynamic.prototype.__prototypeVersion__ = require( '../package.json' ).version ;
Dynamic.prototype.__isDynamic__ = true ;
Dynamic.prototype.__isApplicable__ = false ;



Dynamic.prototype.getValue = Dynamic.prototype.get = function( /* ctx , bound */ ) { throw new Error( 'Dynamic#get() / Dynamic#getValue() should be overloaded' ) ; } ;
Dynamic.prototype.set = function( /* ctx , v */ ) { throw new Error( 'Dynamic#set() should be overloaded' ) ; } ;
Dynamic.prototype.apply = function( /* ctx , bound */ ) { throw new Error( 'Dynamic#apply() should be overloaded' ) ; } ;



Dynamic.prototype.toString = function( ctx ) {
	return '' + this.getFinalValue( ctx ) ;
} ;



Dynamic.prototype.getFinalValue = function( ctx , bound ) {
	var value = this ;

	while ( value && typeof value === 'object' && value.__isDynamic__ ) {
		value = value.getValue( ctx , bound ) ;
	}

	return value ;
} ;



Dynamic.prototype.getRecursiveFinalValue = function( ctx , bound ) {
	return Dynamic.getRecursiveFinalValue( this , ctx , bound ) ;
} ;



Dynamic.get = Dynamic.getValue = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isDynamic__ ) { return value.getValue( ctx , bound ) ; }
	return value ;
} ;



Dynamic.apply = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isApplicable__ ) { return value.apply( ctx , bound ) ; }
	return value ;
} ;



Dynamic.getFinalValue = function( value , ctx , bound ) {
	if ( value && typeof value === 'object' && value.__isDynamic__ ) { return value.getFinalValue( ctx , bound ) ; }
	return value ;
} ;



Dynamic.getRecursiveFinalValue = function( value , ctx , bound , clone1stGen ) {
	var k , copy , proto , original = value , changed = false ;

	value = Dynamic.getFinalValue( value , ctx , bound ) ;

	// It should not be needed to check dynamic/applicable, since they shouldn't have the Object/null proto
	//if ( value && typeof value === 'object' && ! value.__isDynamic__ && ! value.__isApplicable__ ) {
	if ( value && typeof value === 'object' ) {
		copy = value ;

		proto = Object.getPrototypeOf( value ) ;

		if ( Array.isArray( value ) ) {
			if ( original === value ) { copy = [] ; }

			value.forEach( ( v , i ) => {
				copy[ i ] = Dynamic.getRecursiveFinalValue( value[ i ] , ctx , bound , original === value && clone1stGen ) ;
				changed = changed || copy[ i ] !== value[ i ] ;
			} ) ;
		}
		// Only clone plain objects
		else if ( proto === Object.prototype || proto === null ) {
			/*
			if ( value.__isDynamic__ || value.__isApplicable__ ) {
				console.log( "Oh my gawd! Bug!" , proto , proto.constructor.name , value.constructor.name , value.__isDynamic__ , value.__isApplicable__ , value ) ;
			}
			*/

			if ( original === value ) { copy = {} ; }

			// 'for in' because we DO want to patch non-owned properties as well
			for ( k in value ) {
				copy[ k ] = Dynamic.getRecursiveFinalValue( value[ k ] , ctx , bound , original === value && clone1stGen ) ;
				changed = changed || copy[ k ] !== value[ k ] ;
			}
		}

		// Do not use the copy if it is identical to the value
		if ( changed || clone1stGen ) { value = copy ; }
		//value = copy ;
	}

	return value ;
} ;

