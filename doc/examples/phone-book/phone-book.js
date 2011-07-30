$(caterwaul.js_ui(caterwaul.js_all())(function () {
  $('body').append(phone_book()),

  $('.phone-book .create button').live('click',
    delay in phone_book.find('table tbody').append(person().val(
               {name: name.val(), phone: phone.val()}))
             -then- name.add(phone).val('')

             -where [phone_book = $(this).parents('.phone-book').first(),
                     name       = phone_book.find('.create .name'),
                     phone      = phone_book.find('.create .phone')]),

  $('.phone-book .json button.save').live('click',
    delay in textarea.val(phone_book.val())
             -where [phone_book = $(this).parents('.phone-book').first(),
                     textarea   = phone_book.find('.json textarea')]),

  $('.phone-book .json button.load').live('click',
    delay in phone_book.val(textarea.val())
             -where [phone_book = $(this).parents('.phone-book').first(),
                     textarea   = phone_book.find('.json textarea')]),

  $('.phone-book table tr.person button').live('click',
    delay in $(this).parents('.person').first().remove()
             -when- confirm('Are you sure you want to remove this person?')),

  where [
    phone_book() = phone_book_ui().overload_val(phone_book_json),
    phone_book_ui() = jquery in div.phone_book(
                        table(tbody(tr(th('Name'), th('Phone')))),
                        div.create(input.name, input.phone, button('Add')),
                        div.json(textarea, button.save('Save'), button.load('Load'))),

    phone_book_json(json) =
      arguments.length ?
        this.find('table tr.person').remove()
          -then- JSON.parse(json) *[person().val(x)] *![this.append(x)] /seq
          -returning- this :
        JSON.stringify(this.find('table tr.person') *[$(x).val()] -seq),

    person() = person_ui().overload_val(person_json),
    person_ui() = jquery [tr.person(td.name, td.phone, td(button('X')))],

    person_json(person) =
      arguments.length ?
        this -effect- this.find('.name') .text(person.name)
             -effect- this.find('.phone').text(person.phone) :

        {name:  this.find('.name').text(),
         phone: this.find('.phone').text()}];
}));