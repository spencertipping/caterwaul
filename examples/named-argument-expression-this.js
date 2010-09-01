d('|| this === (|| this)()').call(true)         // => false
d('|| this === (@|| this)()').call(true)        // => true
d('@|x| this === x').call(3, 3)                 // => true